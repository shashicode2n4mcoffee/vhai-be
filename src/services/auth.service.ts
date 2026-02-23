/**
 * Auth Service — Handles signup, login, token refresh, logout.
 */

import { prisma } from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshExpiryMs,
} from "../utils/jwt.js";
import { ConflictError, UnauthorizedError, BadRequestError } from "../utils/errors.js";
import type { SignupInput, LoginInput } from "../validators/auth.schema.js";
import { v4 as uuidv4 } from "uuid";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
    collegeRollNumber?: string | null;
    avatarUrl?: string | null;
    organization?: { id: string; name: string; type: string } | null;
  };
  tokens: AuthTokens;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  // Create organization if needed for HIRING_MANAGER or COLLEGE
  let organizationId: string | null = null;
  if (input.organizationName && (input.role === "HIRING_MANAGER" || input.role === "COLLEGE")) {
    const org = await prisma.organization.create({
      data: {
        name: input.organizationName,
        type: input.role === "COLLEGE" ? "college" : "company",
      },
    });
    organizationId = org.id;
  }

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      role: input.role || "CANDIDATE",
      organizationId,
    },
    select: { id: true, name: true, email: true, role: true, organizationId: true, collegeRollNumber: true, avatarUrl: true, organization: { select: { id: true, name: true, type: true } } },
  });

  // Create default settings
  await prisma.userSettings.create({
    data: { userId: user.id },
  });

  const tokens = await generateTokens(user.id, user.role, user.organizationId);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, organizationId: true, collegeRollNumber: true, avatarUrl: true, organization: { select: { id: true, name: true, type: true } } },
  });
  return { user: profile!, tokens };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: {
      id: true, name: true, email: true, role: true,
      organizationId: true, passwordHash: true, isActive: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("Account is deactivated. Please contact support.");
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = await generateTokens(user.id, user.role, user.organizationId);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, organizationId: true, collegeRollNumber: true, avatarUrl: true, organization: { select: { id: true, name: true, type: true } } },
  });
  if (!profile) throw new UnauthorizedError("User not found");
  return { user: profile, tokens };
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  // Check token exists and is not revoked
  const stored = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
    include: { user: { select: { id: true, role: true, organizationId: true, isActive: true } } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    // If token was already used (revoked), revoke ALL tokens for this user (potential theft)
    if (stored?.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw new UnauthorizedError("Refresh token is invalid or expired");
  }

  if (!stored.user.isActive) {
    throw new UnauthorizedError("Account is deactivated");
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await generateTokens(
    stored.user.id,
    stored.user.role,
    stored.user.organizationId,
  );

  return tokens;
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.update({
      where: { id: payload.tokenId },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Token already invalid — that's fine
  }
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true,
      organizationId: true, avatarUrl: true, collegeRollNumber: true, emailVerified: true,
      createdAt: true, lastLoginAt: true,
      organization: { select: { id: true, name: true, type: true } },
    },
  });

  if (!user) {
    throw new BadRequestError("User not found");
  }

  return user;
}

// ─── Internal Helpers ─────────────────────────────────

async function generateTokens(
  userId: string,
  role: string,
  orgId: string | null,
): Promise<AuthTokens> {
  const accessToken = signAccessToken({
    userId,
    role: role as import("@prisma/client").Role,
    orgId,
  });

  const tokenId = uuidv4();
  const expiresAt = new Date(Date.now() + getRefreshExpiryMs());

  const refreshTokenValue = signRefreshToken({ userId, tokenId });

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshTokenValue,
      userId,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}
