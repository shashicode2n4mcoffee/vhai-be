/**
 * Request / Duration Logging Middleware — Logs method, path, requestId, statusCode, durationMs.
 */

import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info("request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
      requestId: req.requestId,
    });
  });
  next();
}
