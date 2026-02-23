/**
 * Errors Service — Log and list user-facing errors for admin tracking.
 */

import { prisma } from "../config/database.js";
import { parsePagination, buildPaginatedResult, type PaginationParams } from "../utils/pagination.js";

export interface LogErrorInput {
  userId: string | null;
  userName?: string | null;
  message: string;
  details?: string | null;
  source?: string | null;
}

export async function logError(input: LogErrorInput) {
  const record = await prisma.errorLog.create({
    data: {
      userId: input.userId,
      userName: input.userName?.slice(0, 500) ?? null,
      message: input.message.slice(0, 2000),
      details: input.details?.slice(0, 10000) ?? null,
      source: input.source?.slice(0, 100) ?? null,
    },
  });
  return record;
}

export interface ListErrorsQuery {
  page?: string;
  limit?: string;
  source?: string;
  userId?: string;
}

export async function listErrors(query: ListErrorsQuery) {
  const { page, limit } = parsePagination(query);
  const source = typeof query.source === "string" && query.source.trim() ? query.source.trim() : undefined;
  const userId = typeof query.userId === "string" && query.userId.trim() ? query.userId.trim() : undefined;

  const where = {
    ...(source && { source }),
    ...(userId && { userId }),
  };

  const [data, total] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.errorLog.count({ where }),
  ]);

  return buildPaginatedResult(data, total, { page, limit });
}
