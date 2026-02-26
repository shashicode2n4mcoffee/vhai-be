/**
 * LiveKit Service — Creates access tokens for Professional video interview.
 * Requires LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in env.
 */

import { AccessToken } from "livekit-server-sdk";
import { env } from "../config/env.js";

export function isLiveKitConfigured(): boolean {
  return Boolean(
    env.LIVEKIT_URL &&
    env.LIVEKIT_API_KEY &&
    env.LIVEKIT_API_SECRET
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
