/**
 * Audit Log Middleware — Logs sensitive operations to the database.
 */

import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";

export interface AuditEntry {
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Log an audit event (non-blocking — fire and forget).
 */
export async function logAudit(
  req: Request,
  entry: AuditEntry,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.userId || "anonymous",
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: (entry.details ?? undefined) as any,
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      },
    });
  } catch (error) {
    logger.error("Failed to write audit log", { error, entry });
  }
}

/**
 * Middleware that adds a unique request ID to every request.
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  next();
}
