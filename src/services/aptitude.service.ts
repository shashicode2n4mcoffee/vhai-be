/**
 * Aptitude Service — CRUD for aptitude tests.
 */

import { prisma } from "../config/database.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { Role } from "@prisma/client";
import { parsePagination, buildPaginatedResult } from "../utils/pagination.js";
import type { CreateAptitudeInput, UpdateAptitudeInput } from "../validators/aptitude.schema.js";
import * as creditsService from "./credits.service.js";

export async function createAptitudeTest(
  candidateId: string,
  input: CreateAptitudeInput,
) {
  const hasCredit = await creditsService.hasAptitudeCredit(candidateId);
  if (!hasCredit) {
    throw new (await import("../utils/errors.js")).PaymentRequiredError(
      "No aptitude credits remaining. Purchase more at /pricing",
    );
  }

  const test = await prisma.aptitudeTest.create({
    data: {
      candidateId,
      topic: input.topic,
      difficulty: input.difficulty,
      quiz: input.quiz as any,
      total: input.total,
    },
  });

  await creditsService.deductCredit(candidateId, "APTITUDE", test.id);
  return test;
}

export async function listAptitudeTests(
  query: { page?: string; limit?: string; candidateId?: string },
  userId: string,
  role: Role,
  orgId: string | null,
) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (role === "ADMIN") {
    if (query.candidateId) where.candidateId = query.candidateId;
  } else if (role === "HIRING_MANAGER" || role === "COLLEGE") {
    where.candidate = { organizationId: orgId };
    if (query.candidateId) where.candidateId = query.candidateId;
  } else {
    where.candidateId = userId;
  }

  const [tests, total] = await Promise.all([
    prisma.aptitudeTest.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, topic: true, difficulty: true,
        score: true, total: true, percentage: true,
        passed: true, createdAt: true, completedAt: true,
        candidate: { select: { id: true, name: true } },
      },
    }),
    prisma.aptitudeTest.count({ where: where as any }),
  ]);

  return buildPaginatedResult(tests, total, { page, limit });
}

export async function getAptitudeTestById(
  id: string,
  userId: string,
  role: Role,
  orgId: string | null,
) {
  const test = await prisma.aptitudeTest.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, email: true, organizationId: true } },
    },
  });

  if (!test) throw new NotFoundError("Aptitude test not found");

  if (role === "ADMIN") {
    // Full access
  } else if (role === "HIRING_MANAGER" || role === "COLLEGE") {
    if (test.candidate.organizationId !== orgId) {
      throw new ForbiddenError("Access denied");
    }
  } else if (test.candidateId !== userId) {
    throw new ForbiddenError("You can only view your own tests");
  }

  return test;
}

export async function updateAptitudeTest(
  id: string,
  userId: string,
  input: UpdateAptitudeInput,
) {
  const test = await prisma.aptitudeTest.findUnique({ where: { id } });
  if (!test) throw new NotFoundError("Aptitude test not found");
  if (test.candidateId !== userId) {
    throw new ForbiddenError("You can only update your own tests");
  }

  return prisma.aptitudeTest.update({
    where: { id },
    data: {
      answers: input.answers as any,
      score: input.score,
      percentage: input.percentage,
      passed: input.passed,
      timeSpent: input.timeSpent,
      completedAt: new Date(),
    },
  });
}

export async function deleteAptitudeTest(id: string) {
  const test = await prisma.aptitudeTest.findUnique({ where: { id } });
  if (!test) throw new NotFoundError("Aptitude test not found");
  await prisma.aptitudeTest.delete({ where: { id } });
}
