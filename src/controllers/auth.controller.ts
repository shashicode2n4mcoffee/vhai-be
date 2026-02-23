/**
 * Auth Controller — Handles HTTP requests for authentication.
 */

import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { logAudit } from "../middleware/auditLog.js";

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup(req.body);
    await logAudit(req, { action: "SIGNUP", resource: "user", resourceId: result.user.id });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    await logAudit(req, { action: "LOGIN", resource: "user", resourceId: result.user.id });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.refreshAccessToken(req.body.refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.body.refreshToken);
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
