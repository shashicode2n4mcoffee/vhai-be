/**
 * HttpOnly refresh token cookie — XSS-safe storage for refresh token.
 */

import type { Response } from "express";
import { env } from "../config/env.js";
import { getRefreshExpiryMs } from "./jwt.js";

export const REFRESH_COOKIE_NAME = "vocalhireai_refresh";

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getRefreshExpiryMs(),
    path: "/api",
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api" });
}
