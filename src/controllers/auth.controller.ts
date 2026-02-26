/**
 * Auth Controller — Handles HTTP requests for authentication.
 * Supports httpOnly cookie for refresh token (read from cookie or body).
 */

import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { logAudit } from "../middleware/auditLog.js";
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from "../utils/authCookie.js";
import { UnauthorizedError } from "../utils/errors.js";

function getRefreshToken(req: Request): string | null {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const fromBody = req.body?.refreshToken;
  const token = typeof fromCookie === "string" && fromCookie ? fromCookie : fromBody;
  return typeof token === "string" && token ? token : null;
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup(req.body);
    setRefreshCookie(res, result.tokens.refreshToken);
    await logAudit(req, { action: "SIGNUP", resource: "user", resourceId: result.user.id });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.tokens.refreshToken);
    await logAudit(req, { action: "LOGIN", resource: "user", resourceId: result.user.id });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = getRefreshToken(req);
    if (!refreshToken) throw new UnauthorizedError("Refresh token required (cookie or body)");
    const tokens = await authService.refreshAccessToken(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = getRefreshToken(req);
    if (refreshToken) await authService.logout(refreshToken);
    clearRefreshCookie(res);
    await logAudit(req, { action: "LOGOUT", resource: "user", resourceId: req.userId });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getProfile(req.userId!);
    res.json(user);
  } catch (error) {
    next(error);
  }
}
