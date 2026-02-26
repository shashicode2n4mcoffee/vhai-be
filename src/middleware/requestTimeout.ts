/**
 * Request Timeout Middleware — Aborts long-running requests.
 */

import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

const TIMEOUT_MS = env.REQUEST_TIMEOUT_MS ?? 30000;

export function requestTimeoutMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (TIMEOUT_MS <= 0) return next();
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: "Request timeout" });
      res.end();
    }
  }, TIMEOUT_MS);

  const onFinish = () => {
    clearTimeout(timer);
    res.removeListener("finish", onFinish);
    res.removeListener("close", onFinish);
  };
  res.once("finish", onFinish);
  res.once("close", onFinish);
  next();
}
