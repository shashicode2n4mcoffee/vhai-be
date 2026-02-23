/**
 * Analytics Controller — Dashboard stats and exports.
 */

import type { Request, Response, NextFunction } from "express";
import * as analyticsService from "../services/analytics.service.js";

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await analyticsService.getDashboardStats(
      req.userId!,
      req.userRole!,
      req.userOrgId ?? null,
    );
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function candidates(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getCandidateOverview(
      req.userId!,
      req.userRole!,
      req.userOrgId ?? null,
      req.query as any,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportData(req: Request, res: Response, next: NextFunction) {
  try {
    const type = (req.query.type as string) || "interviews";
    const data = await analyticsService.getExportData(
      req.userId!,
      req.userRole!,
      req.userOrgId ?? null,
      type,
    );
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
