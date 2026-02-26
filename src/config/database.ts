/**
 * Prisma Client Singleton — Prevents multiple instances in development.
 * In production (e.g. Cloud Run), uses connection_limit to avoid exhausting DB connections.
 * Optional slow-query logging via SLOW_QUERY_MS (Prisma Client extension).
 */

import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import { logger } from "./logger.js";

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrisma> };

function getDatasourceUrl(): string | undefined {
  const url = env.DATABASE_URL;
  if (env.NODE_ENV !== "production") return undefined;
  if (!url || url.includes("connection_limit=")) return undefined;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}connection_limit=10`;
}

const slowQueryMs = env.SLOW_QUERY_MS ?? 0;

function createPrisma() {
  const base = new PrismaClient({
    ...(getDatasourceUrl() && { datasources: { db: { url: getDatasourceUrl()! } } }),
    log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

  if (slowQueryMs <= 0) return base;

  return base.$extends({
    name: "slowQueryLog",
    query: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now();
        const result = await query(args);
        const duration = Date.now() - start;
        if (duration >= slowQueryMs) {
          logger.warn("Slow query", {
            model: model ?? "raw",
            operation,
            durationMs: duration,
          });
        }
        return result;
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
