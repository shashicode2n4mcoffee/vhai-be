/**
 * Webhooks Controller — LiveKit webhooks (P1).
 * Handle room_finished, egress_ended. Enable/disable via LIVEKIT_WEBHOOKS_ENABLED.
 */

import type { Request, Response, NextFunction } from "express";
import { WebhookReceiver, type WebhookEvent } from "livekit-server-sdk";
import { env } from "../config/env.js";
import * as livekitService from "../services/livekit.service.js";
import { prisma } from "../config/database.js";
import { InterviewStatus } from "@prisma/client";

export async function livekitWebhook(req: Request, res: Response, _next: NextFunction) {
  if (!livekitService.isLiveKitWebhooksEnabled()) {
    res.status(503).json({ error: "LiveKit webhooks are disabled" });
    return;
  }

  const rawBody = req.body;
  const bodyStr = typeof rawBody === "string" ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : "";
  const authHeader = (req.get("Authorize") ?? req.get("Authorization")) ?? "";

  let event: WebhookEvent;
  try {
    const receiver = new WebhookReceiver(env.LIVEKIT_API_KEY!, env.LIVEKIT_API_SECRET!);
    event = await receiver.receive(bodyStr, authHeader);
  } catch (err) {
    console.error("[LiveKit Webhook] Verify failed:", err);
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  res.status(200).json({ received: true });

  setImmediate(() => {
    handleLiveKitEvent(event).catch((err) => console.error("[LiveKit Webhook] Handler error:", err));
  });
}

async function handleLiveKitEvent(event: WebhookEvent) {
  const ev = event.event;

  if (ev === "room_finished" && event.room?.name) {
    const roomName = event.room.name;
    try {
      await prisma.interview.updateMany({
        where: { id: roomName, status: InterviewStatus.IN_PROGRESS },
        data: { status: InterviewStatus.COMPLETED, completedAt: new Date() },
      });
    } catch (e) {
      console.error("[LiveKit Webhook] room_finished update:", e);
    }
    return;
  }

  if (ev === "egress_ended" && event.egressInfo) {
    const roomName = event.egressInfo.roomName;
    const fileResults = event.egressInfo.fileResults ?? [];
    const firstFile = fileResults[0];
    const location = firstFile?.location ?? (firstFile as { location?: string })?.location;
    if (roomName && location) {
      try {
        await prisma.interview.update({
          where: { id: roomName },
          data: { cloudRecordingUrl: location },
        });
      } catch (e) {
        console.error("[LiveKit Webhook] egress_ended update:", e);
      }
    }
  }
}
