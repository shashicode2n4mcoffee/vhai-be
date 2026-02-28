/**
 * LiveKit Controller — Serves LiveKit token for Professional video interview.
 * When interviewId + templateId are provided and room metadata is enabled, creates room with metadata and optional Egress.
 */

import type { Request, Response, NextFunction } from "express";
import * as livekitService from "../services/livekit.service.js";
import { logAudit } from "../middleware/auditLog.js";

export async function getToken(req: Request, res: Response, next: NextFunction) {
  try {
    if (!livekitService.isLiveKitConfigured()) {
      res.status(503).json({
        error: "LiveKit is not configured",
        code: "LIVEKIT_NOT_CONFIGURED",
      });
      return;
    }

    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = req.body as {
      roomName?: string;
      participantName?: string;
      interviewId?: string;
      templateId?: string;
      role?: string;
    };
    const interviewId = body.interviewId as string | undefined;
    const templateId = body.templateId as string | undefined;
    const participantName = body.participantName ?? "Candidate";
    const role = body.role as string | undefined;
    const roomNameForObserver = body.roomName as string | undefined;

    if (role === "observer" && roomNameForObserver) {
      const canObserve = await livekitService.canObserveRoom({
        roomName: roomNameForObserver,
        userId: userId!,
        userRole: req.userRole ?? "CANDIDATE",
        userOrgId: req.userOrgId ?? null,
      });
      if (!canObserve) {
        res.status(403).json({ error: "Not allowed to observe this room." });
        return;
      }
      const { token, url } = await livekitService.createObserverToken({
        roomName: roomNameForObserver,
        participantIdentity: `observer-${userId}`,
        participantName: participantName ?? "Observer",
      });
      await logAudit(req, { action: "LIVEKIT_OBSERVER_TOKEN", resource: "livekit", details: { roomName: roomNameForObserver } });
      res.json({ token, url, roomName: roomNameForObserver });
      return;
    }

    if (interviewId && templateId) {
      const { token, url, roomName, agentDispatched } = await livekitService.createRoomAndToken({
        interviewId,
        templateId,
        userId,
        participantName,
      });
      await logAudit(req, { action: "LIVEKIT_TOKEN_FETCH", resource: "livekit", details: { roomName, interviewId, agentDispatched } });
      res.json({ token, url, roomName, interviewId, agentDispatched });
      return;
    }

    const roomName = body.roomName ?? `professional-${userId}-${Date.now()}`;
    const { token, url } = await livekitService.createAccessToken({
      roomName,
      participantIdentity: `user-${userId}`,
      participantName,
    });

    await logAudit(req, { action: "LIVEKIT_TOKEN_FETCH", resource: "livekit", details: { roomName } });
    res.json({ token, url, roomName });
  } catch (error) {
    next(error);
  }
}

/** Check if LiveKit is configured (for frontend to show/hide Professional flow) */
export async function getConfig(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ enabled: livekitService.isLiveKitConfigured() });
  } catch (error) {
    next(error);
  }
}

/** P2 Analytics: receive connection quality sample (when livekitAnalyticsEnabled). */
export async function reportQuality(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { quality?: string; roomName?: string };
    const quality = body.quality ?? "";
    const roomName = body.roomName ?? "";
    if (quality) {
      console.info("[LiveKit] Quality sample", { userId: req.userId, quality, roomName });
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
}
