/**
 * LiveKit Service — Creates rooms, tokens, and optional Egress for Professional video interview.
 * Requires LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in env.
 * P0: Cloud recording via Egress (LIVEKIT_EGRESS_GCS_BUCKET + credentials).
 * P1: Room metadata (interviewId, templateId); P1 webhooks in webhooks/livekit.
 * P2/P3: Data channel, analytics, simulcast, E2EE are client-side + settings.
 */

import {
  AccessToken,
  RoomServiceClient,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  GCPUpload,
  RoomAgentDispatch,
} from "livekit-server-sdk";
import { env } from "../config/env.js";
import * as settingsService from "./settings.service.js";
import * as creditsService from "./credits.service.js";
import { prisma } from "../config/database.js";

export function isLiveKitConfigured(): boolean {
  return Boolean(
    env.LIVEKIT_URL &&
    env.LIVEKIT_API_KEY &&
    env.LIVEKIT_API_SECRET
  );
}

export function isLiveKitWebhooksEnabled(): boolean {
  return Boolean(env.LIVEKIT_WEBHOOKS_ENABLED && isLiveKitConfigured());
}

export function isEgressConfigured(): boolean {
  return Boolean(
    isLiveKitConfigured() &&
    env.LIVEKIT_EGRESS_GCS_BUCKET &&
    env.LIVEKIT_EGRESS_GCS_CREDENTIALS
  );
}

export interface LiveKitTokenOptions {
  roomName: string;
  participantIdentity: string;
  participantName?: string;
  ttl?: string;
}

export async function createAccessToken(opts: LiveKitTokenOptions): Promise<{ token: string; url: string }> {
  if (!isLiveKitConfigured()) {
    throw new Error("LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET.");
  }

  const at = new AccessToken(
    env.LIVEKIT_API_KEY!,
    env.LIVEKIT_API_SECRET!,
    {
      identity: opts.participantIdentity,
      name: opts.participantName ?? opts.participantIdentity,
      ttl: opts.ttl ?? "2h",
    }
  );

  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  return { token, url: env.LIVEKIT_URL! };
}

/** Observer (view-only) token: subscribe only, no publish. For HR watching an interview room. */
export async function createObserverToken(opts: {
  roomName: string;
  participantIdentity: string;
  participantName?: string;
  ttl?: string;
}): Promise<{ token: string; url: string }> {
  if (!isLiveKitConfigured()) {
    throw new Error("LiveKit is not configured.");
  }
  const at = new AccessToken(
    env.LIVEKIT_API_KEY!,
    env.LIVEKIT_API_SECRET!,
    {
      identity: opts.participantIdentity,
      name: opts.participantName ?? "Observer",
      ttl: opts.ttl ?? "2h",
    }
  );
  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: false,
    canSubscribe: true,
    canPublishData: false,
  });
  const token = await at.toJwt();
  return { token, url: env.LIVEKIT_URL! };
}

/** Check if user can receive an observer token for room (roomName = interviewId). */
export async function canObserveRoom(opts: {
  roomName: string;
  userId: string;
  userRole: string;
  userOrgId: string | null;
}): Promise<boolean> {
  const interview = await prisma.interview.findUnique({
    where: { id: opts.roomName },
    include: { template: { select: { organizationId: true } } },
  });
  if (!interview) return false;
  const templateOrgId = interview.template.organizationId ?? null;
  if (opts.userRole === "ADMIN") return true;
  if (opts.userRole !== "HIRING_MANAGER" && opts.userRole !== "COLLEGE") return false;
  if (templateOrgId !== opts.userOrgId) return false;
  const settings = await settingsService.getSettings(opts.userId);
  const allowed = (settings as { livekitObserverTokenAllowed?: boolean }).livekitObserverTokenAllowed === true;
  return allowed;
}

export interface CreateRoomAndTokenOptions {
  interviewId: string;
  templateId: string;
  userId: string;
  participantName?: string;
}

/**
 * P1: Create room with metadata (if enabled), P0: optionally start Egress, then return token.
 * Room name = interviewId so webhooks can update the correct interview.
 */
export async function createRoomAndToken(opts: CreateRoomAndTokenOptions): Promise<{
  token: string;
  url: string;
  roomName: string;
}> {
  if (!isLiveKitConfigured()) {
    throw new Error("LiveKit is not configured.");
  }

  const settings = await settingsService.getSettings(opts.userId);
  const roomName = opts.interviewId; // so webhook egress_ended can find interview by room name
  const metadata = JSON.stringify({
    interviewId: opts.interviewId,
    templateId: opts.templateId,
    userId: opts.userId,
  });

  const roomMetadataEnabled = (settings as { livekitRoomMetadataEnabled?: boolean }).livekitRoomMetadataEnabled !== false;
  const cloudRecordingEnabled = settings.cloudRecordingEnabled === true;
  const balance = await creditsService.getBalance(opts.userId);
  const hasBusinessPlan = balance.hasBusinessPlan === true;
  const shouldEgress = cloudRecordingEnabled && hasBusinessPlan && isEgressConfigured();

  const livekitAgentEnabled = (settings as { livekitAgentEnabled?: boolean }).livekitAgentEnabled === true;
  const agentName = env.LIVEKIT_AGENT_NAME;
  const shouldDispatchAgent = livekitAgentEnabled && Boolean(agentName);
  const shouldCreateRoom = roomMetadataEnabled || shouldDispatchAgent;

  if (shouldCreateRoom) {
    const roomSvc = new RoomServiceClient(
      env.LIVEKIT_URL!,
      env.LIVEKIT_API_KEY,
      env.LIVEKIT_API_SECRET
    );
    const agents: RoomAgentDispatch[] =
      shouldDispatchAgent && agentName
        ? [new RoomAgentDispatch({ agentName, metadata: JSON.stringify({ interviewId: opts.interviewId, templateId: opts.templateId }) })]
        : [];
    await roomSvc.createRoom({
      name: roomName,
      emptyTimeout: 300,
      departureTimeout: 30,
      ...(roomMetadataEnabled && { metadata }),
      ...(agents.length > 0 && { agents }),
    });
  }

  if (shouldEgress) {
    try {
      const egressClient = new EgressClient(
        env.LIVEKIT_URL!,
        env.LIVEKIT_API_KEY,
        env.LIVEKIT_API_SECRET
      );
      const filepath = `interviews/${opts.interviewId}-{time}.mp4`;
      const gcp = new GCPUpload({
        bucket: env.LIVEKIT_EGRESS_GCS_BUCKET!,
        credentials: env.LIVEKIT_EGRESS_GCS_CREDENTIALS!,
      });
      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath,
        output: { case: "gcp", value: gcp },
      });
      await egressClient.startRoomCompositeEgress(roomName, { file: fileOutput }, { audioOnly: false });
    } catch (err) {
      console.error("[LiveKit] Egress start failed:", err);
      // do not fail token; interview can continue without cloud recording
    }
  }

  const { token, url } = await createAccessToken({
    roomName,
    participantIdentity: `user-${opts.userId}`,
    participantName: opts.participantName ?? "Candidate",
  });

  return { token, url, roomName };
}
