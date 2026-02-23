/**
 * Coding Service — CRUD for coding tests.
 */

import { prisma } from "../config/database.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { Role } from "@prisma/client";
import { parsePagination, buildPaginatedResult } from "../utils/pagination.js";
import type { CreateCodingInput, UpdateCodingInput } from "../validators/coding.schema.js";
import * as creditsService from "./credits.service.js";

export async function createCodingTest(
  candidateId: string,
  input: CreateCodingInput,
) {
  const hasCredit = await creditsService.hasCodingCredit(candidateId);
  if (!hasCredit) {
    throw new (await import("../utils/errors.js")).PaymentRequiredError(
      "No coding credits remaining. Purchase more at /pricing",
    );
  }

  const test = await prisma.codingTest.create({
    data: {
      candidateId,
      topic: input.topic,
      language: input.language,
      difficulty: input.difficulty,
      problem: input.problem as any,
    },
  });

  await creditsService.deductCredit(candidateId, "CODING", test.id);
  return test;
}

export async function listCodingTests(
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
    prisma.codingTest.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, topic: true, language: true, difficulty: true,
        score: true, verdict: true, timeSpent: true,
        createdAt: true, completedAt: true,
        candidate: { select: { id: true, name: true } },
      },
    }),
    prisma.codingTest.count({ where: where as any }),
  ]);

  return buildPaginatedResult(tests, total, { page, limit });
}

export async function getCodingTestById(
  id: string,
  userId: string,
  role: Role,
  orgId: string | null,
) {
  const test = await prisma.codingTest.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, email: true, organizationId: true } },
    },
  });

  if (!test) throw new NotFoundError("Coding test not found");

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

export async function updateCodingTest(
  id: string,
  userId: string,
  input: UpdateCodingInput,
) {
  const test = await prisma.codingTest.findUnique({ where: { id } });
  if (!test) throw new NotFoundError("Coding test not found");
  if (test.candidateId !== userId) {
    throw new ForbiddenError("You can only update your own tests");
  }

  return prisma.codingTest.update({
    where: { id },
    data: {
      userCode: input.userCode,
      evaluation: input.evaluation as any,
      score: input.score,
      verdict: input.verdict,
      timeSpent: input.timeSpent,
      completedAt: new Date(),
    },
  });
}

export async function deleteCodingTest(id: string) {
  const test = await prisma.codingTest.findUnique({ where: { id } });
  if (!test) throw new NotFoundError("Coding test not found");
  await prisma.codingTest.delete({ where: { id } });
}
