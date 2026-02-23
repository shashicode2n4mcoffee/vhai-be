/**
 * Errors Controller — Log errors (authenticated or optional) and list for admins.
 */

import type { Request, Response, NextFunction } from "express";
import * as errorsService from "../services/errors.service.js";

export async function log(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, details, source, userId: bodyUserId, userName: bodyUserName } = req.body as {
      message?: string;
      details?: string;
      source?: string;
      userId?: string;
      userName?: string;
    };
    const msg = typeof message === "string" && message.trim() ? message.trim() : "Unknown error";
    // Prefer JWT userId; fall back to client-supplied userId (e.g. when token expired but client knows user)
    const userId = req.userId ?? (typeof bodyUserId === "string" && bodyUserId.trim() ? bodyUserId.trim() : null);
    const userName = typeof bodyUserName === "string" && bodyUserName.trim() ? bodyUserName.trim().slice(0, 500) : null;
    const record = await errorsService.logError({
      userId,
      userName,
      message: msg,
      details: typeof details === "string" ? details : null,
      source: typeof source === "string" ? source : null,
    });
    res.status(201).json({ id: record.id });
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await errorsService.listErrors(req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
