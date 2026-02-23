/**
 * Gemini Controller — Securely vends Gemini API config.
 */

import type { Request, Response, NextFunction } from "express";
import * as geminiService from "../services/gemini.service.js";
import { logAudit } from "../middleware/auditLog.js";

export async function getToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = geminiService.getGeminiToken();
    await logAudit(req, { action: "GEMINI_TOKEN_FETCH", resource: "gemini" });
    res.json(token);
  } catch (error) {
    next(error);
  }
}
