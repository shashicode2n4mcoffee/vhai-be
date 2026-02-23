/**
 * Interview Templates Service — CRUD operations for templates.
 */

import { prisma } from "../config/database.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { Role } from "@prisma/client";
import { parsePagination, buildPaginatedResult } from "../utils/pagination.js";
import type { CreateTemplateInput, UpdateTemplateInput } from "../validators/templates.schema.js";

export async function createTemplate(
  userId: string,
  orgId: string | null,
  input: CreateTemplateInput,
) {
  return prisma.interviewTemplate.create({
    data: {
      creatorId: userId,
      organizationId: orgId,
      name: input.name,
      aiBehavior: input.aiBehavior,
      customerWants: input.customerWants,
      candidateOffers: input.candidateOffers,
      isPublic: input.isPublic,
    },
  });
}

export async function listTemplates(
  query: { page?: string; limit?: string },
  userId: string,
  role: Role,
  orgId: string | null,
) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (role === "ADMIN") {
    // Admins see everything
  } else if (role === "HIRING_MANAGER" || role === "COLLEGE") {
    // See own org templates + public
    where.OR = [
      { organizationId: orgId },
      { creatorId: userId },
      { isPublic: true },
    ];
  } else {
    // Candidates see public templates + their org's
    where.OR = [
      { isPublic: true },
      ...(orgId ? [{ organizationId: orgId }] : []),
    ];
  }

  const [templates, total] = await Promise.all([
    prisma.interviewTemplate.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { id: true, name: true } } },
    }),
    prisma.interviewTemplate.count({ where: where as any }),
  ]);

  return buildPaginatedResult(templates, total, { page, limit });
}

export async function getTemplateById(id: string) {
  const template = await prisma.interviewTemplate.findUnique({
    where: { id },
    include: { creator: { select: { id: true, name: true } } },
  });

  if (!template) throw new NotFoundError("Template not found");
  return template;
}

export async function updateTemplate(
  id: string,
  userId: string,
  role: Role,
  input: UpdateTemplateInput,
) {
  const template = await prisma.interviewTemplate.findUnique({ where: { id } });
  if (!template) throw new NotFoundError("Template not found");

  if (template.creatorId !== userId && role !== "ADMIN") {
    throw new ForbiddenError("You can only edit your own templates");
  }

  return prisma.interviewTemplate.update({
    where: { id },
    data: input,
  });
}

export async function deleteTemplate(id: string, userId: string, role: Role) {
  const template = await prisma.interviewTemplate.findUnique({ where: { id } });
  if (!template) throw new NotFoundError("Template not found");

  if (template.creatorId !== userId && role !== "ADMIN") {
    throw new ForbiddenError("You can only delete your own templates");
  }

  await prisma.interviewTemplate.delete({ where: { id } });
}
