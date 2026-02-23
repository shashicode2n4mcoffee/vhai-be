/**
 * Assignments Service — Manage test assignments between managers and candidates.
 */

import { prisma } from "../config/database.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { Role } from "@prisma/client";
import { parsePagination, buildPaginatedResult } from "../utils/pagination.js";
import type { CreateAssignmentInput, BulkCreateAssignmentInput } from "../validators/assignments.schema.js";

export async function createAssignment(
  creatorId: string,
  input: CreateAssignmentInput,
) {
  // Verify candidate exists
  const candidate = await prisma.user.findUnique({ where: { id: input.candidateId } });
  if (!candidate) throw new NotFoundError("Candidate not found");

  return prisma.testAssignment.create({
    data: {
      type: input.type,
      creatorId,
      candidateId: input.candidateId,
      config: input.config as any,
      deadline: input.deadline ? new Date(input.deadline) : null,
    },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });
}

export async function bulkCreateAssignments(
  creatorId: string,
  input: BulkCreateAssignmentInput,
) {
  const assignments = await Promise.all(
    input.candidateIds.map((candidateId) =>
      prisma.testAssignment.create({
        data: {
          type: input.type,
          creatorId,
          candidateId,
          config: input.config as any,
          deadline: input.deadline ? new Date(input.deadline) : null,
        },
      }),
    ),
  );
  return assignments;
}

export async function listAssignments(
  query: { page?: string; limit?: string; status?: string; type?: string },
  userId: string,
  role: Role,
) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;

  if (role === "ADMIN") {
    // See all
  } else if (role === "HIRING_MANAGER" || role === "COLLEGE") {
    where.creatorId = userId;
  } else {
    where.candidateId = userId;
  }

  const [assignments, total] = await Promise.all([
    prisma.testAssignment.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    }),
    prisma.testAssignment.count({ where: where as any }),
  ]);

  return buildPaginatedResult(assignments, total, { page, limit });
}

export async function getAssignmentById(id: string, userId: string, role: Role) {
  const assignment = await prisma.testAssignment.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  if (!assignment) throw new NotFoundError("Assignment not found");

  if (role !== "ADMIN" && assignment.creatorId !== userId && assignment.candidateId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return assignment;
}

export async function updateAssignment(
  id: string,
  userId: string,
  role: Role,
  data: { status?: string; resultId?: string; deadline?: string },
) {
  const assignment = await prisma.testAssignment.findUnique({ where: { id } });
  if (!assignment) throw new NotFoundError("Assignment not found");

  if (role !== "ADMIN" && assignment.creatorId !== userId && assignment.candidateId !== userId) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.testAssignment.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status as any }),
      ...(data.resultId && { resultId: data.resultId }),
      ...(data.deadline && { deadline: new Date(data.deadline) }),
    },
  });
}

export async function deleteAssignment(id: string, userId: string, role: Role) {
  const assignment = await prisma.testAssignment.findUnique({ where: { id } });
  if (!assignment) throw new NotFoundError("Assignment not found");

  if (role !== "ADMIN" && assignment.creatorId !== userId) {
    throw new ForbiddenError("Only the creator or admin can delete assignments");
  }

  await prisma.testAssignment.delete({ where: { id } });
}
