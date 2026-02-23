/**
 * Users Service — Profile management, user listing, role changes.
 */

import { prisma } from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { NotFoundError, BadRequestError, UnauthorizedError } from "../utils/errors.js";
import type { Role } from "@prisma/client";
import { parsePagination, buildPaginatedResult } from "../utils/pagination.js";

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  organizationId: true, isActive: true, avatarUrl: true,
  collegeRollNumber: true,
  createdAt: true, lastLoginAt: true,
  organization: { select: { id: true, name: true, type: true } },
};

export async function listUsers(
  query: { page?: string; limit?: string; role?: string; search?: string; organizationId?: string },
  requestingRole: Role,
  requestingOrgId: string | null,
) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  // Build filter
  const where: Record<string, unknown> = { isActive: true };

  if (query.role) where.role = query.role;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  // Scope by role
  if (requestingRole === "HIRING_MANAGER" || requestingRole === "COLLEGE") {
    where.organizationId = requestingOrgId;
  }

  if (query.organizationId && requestingRole === "ADMIN") {
    where.organizationId = query.organizationId;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where as any,
      select: USER_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: where as any }),
  ]);

  return buildPaginatedResult(users, total, { page, limit });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_SELECT,
      emailVerified: true,
      _count: {
        select: {
          interviews: true,
          aptitudeTests: true,
          codingTests: true,
        },
      },
    },
  });

  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; avatarUrl?: string | null; collegeRollNumber?: string | null },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.collegeRollNumber !== undefined && { collegeRollNumber: data.collegeRollNumber }),
    },
    select: USER_SELECT,
  });

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) throw new NotFoundError("User not found");

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Current password is incorrect");

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}

export async function changeRole(targetUserId: string, newRole: Role) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundError("User not found");

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  return { id: targetUserId, role: newRole };
}

export async function softDeleteUser(targetUserId: string) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundError("User not found");

  await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: false },
  });

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId: targetUserId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function deleteOwnAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) throw new NotFoundError("User not found");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new BadRequestError("Password is incorrect");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
