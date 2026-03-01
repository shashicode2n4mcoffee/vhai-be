/**
 * DeepSeek Controller — Securely vends DeepSeek API config for aptitude/coding/report.
 */

import type { Request, Response, NextFunction } from "express";
import * as deepseekService from "../services/deepseek.service.js";
import { logAudit } from "../middleware/auditLog.js";

export async function getToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = deepseekService.getDeepSeekToken();
    if (!token) {
      res.status(503).json({ error: "DeepSeek is not configured. Set DEEPSEEK_API_KEY." });
      return;
    }
    await logAudit(req, { action: "DEEPSEEK_TOKEN_FETCH", resource: "deepseek" });
    res.json(token);
  } catch (error) {
    next(error);
  }
}
