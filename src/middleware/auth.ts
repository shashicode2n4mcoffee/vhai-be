/**
 * Authentication Middleware — Verifies JWT access token.
 */

import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid authorization header"));
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    req.userOrgId = payload.orgId;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

/** Optional authentication — sets user info if token is present, continues otherwise */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    req.userOrgId = payload.orgId;
  } catch {
    // Token invalid — continue without auth
  }

  next();
}
