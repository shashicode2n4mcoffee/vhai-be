/**
 * Settings Controller — User preferences.
 */

import type { Request, Response, NextFunction } from "express";
import * as settingsService from "../services/settings.service.js";

function isMissingColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /column.*does not exist|Unknown column|resumeSummary/i.test(msg) ||
    (msg.includes("user_settings") && /does not exist|invalid column/i.test(msg))
  );
}

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getSettings(req.userId!);
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.updateSettings(req.userId!, req.body);
    res.json(settings);
  } catch (error) {
    if (isMissingColumnError(error)) {
      res.status(503).json({
        error:
          "Database schema is out of date. Run this on your database: ALTER TABLE \"user_settings\" ADD COLUMN IF NOT EXISTS \"resumeSummary\" TEXT;",
        code: "SCHEMA_MIGRATION_REQUIRED",
      });
      return;
    }
    next(error);
  }
}
