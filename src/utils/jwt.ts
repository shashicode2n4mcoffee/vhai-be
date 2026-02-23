/**
 * JWT Utilities — Token generation and verification.
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "@prisma/client";

export interface AccessTokenPayload {
  userId: string;
  role: Role;
  orgId: string | null;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
    issuer: "vocalhireai",
    audience: "vocalhireai-client",
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload as object, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
    issuer: "vocalhireai",
    audience: "vocalhireai-client",
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "vocalhireai",
    audience: "vocalhireai-client",
  }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "vocalhireai",
    audience: "vocalhireai-client",
  }) as RefreshTokenPayload;
}

/** Parse JWT_REFRESH_EXPIRY string like "7d" into milliseconds */
export function getRefreshExpiryMs(): number {
  const exp = env.JWT_REFRESH_EXPIRY;
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d

  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;

  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default:  return 7 * 24 * 60 * 60 * 1000;
  }
}
