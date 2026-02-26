/**
 * Global Error Handler — Catches all errors and returns consistent JSON.
 */

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`${err.statusCode} ${err.message}`, {
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    });
  } else {
    logger.error("Unhandled error", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    });
  }

  // Determine status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Build response — standard shape: { error } plus optional reserved fields (upgradeUrl, requestId, stack in dev)
  const response: Record<string, unknown> = {
    error: err instanceof AppError ? err.message : "Internal server error",
  };
  if (statusCode === 402) {
    response.upgradeUrl = "/pricing";
  }
  if (req.requestId) {
    response.requestId = req.requestId;
  }
  if (env.NODE_ENV === "development" && !(err instanceof AppError)) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/** 404 handler for unmatched routes */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
