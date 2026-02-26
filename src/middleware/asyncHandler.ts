/**
 * Async handler wrapper — Forwards promise rejections to Express next().
 * Use for any async route handler so unhandled rejections become 500s instead of uncaught.
 */

import type { Request, Response, NextFunction } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): AsyncRequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
