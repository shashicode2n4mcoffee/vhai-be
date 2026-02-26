/**
 * LiveKit Controller — Serves LiveKit token for Professional video interview.
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

    const roomName = (req.body?.roomName as string) || `professional-${userId}-${Date.now()}`;
    const participantName = (req.body?.participantName as string) || `Candidate`;

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
