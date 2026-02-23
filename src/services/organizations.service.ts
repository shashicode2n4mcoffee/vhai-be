/**
 * Organizations Service — Manage orgs, invite users, guardrails (EEO, do-not-ask).
 */

import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, ForbiddenError } from "../utils/errors.js";
import type { Role } from "@prisma/client";
import { parsePagination, buildPaginatedResult } from "../utils/pagination.js";
import type { OrgGuardrails } from "./guardrails.service.js";
import { EEO_DEFAULT_TOPICS } from "./guardrails.service.js";

export async function getGuardrailsForOrg(orgId: string | null): Promise<OrgGuardrails> {
  if (!orgId) {
    return {
      eeoSafeMode: true,
      doNotAskTopics: [],
      toxicityTerminateOnHigh: true,
    };
  }
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { eeoSafeMode: true, doNotAskTopics: true, toxicityTerminateOnHigh: true },
  });
  if (!org) {
    return { eeoSafeMode: true, doNotAskTopics: [], toxicityTerminateOnHigh: true };
  }
  const topics = org.doNotAskTopics as string[] | null;
  const effectiveTopics =
    Array.isArray(topics) && topics.length > 0 ? topics : org.eeoSafeMode ? EEO_DEFAULT_TOPICS : [];
  return {
    eeoSafeMode: org.eeoSafeMode,
    doNotAskTopics: effectiveTopics,
    toxicityTerminateOnHigh: org.toxicityTerminateOnHigh,
  };
}

export async function updateGuardrails(
  orgId: string,
  data: { eeoSafeMode?: boolean; doNotAskTopics?: string[]; toxicityTerminateOnHigh?: boolean },
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError("Organization not found");

  return prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(data.eeoSafeMode !== undefined && { eeoSafeMode: data.eeoSafeMode }),
      ...(data.doNotAskTopics !== undefined && { doNotAskTopics: data.doNotAskTopics }),
      ...(data.toxicityTerminateOnHigh !== undefined && { toxicityTerminateOnHigh: data.toxicityTerminateOnHigh }),
    },
  });
}

export async function createOrganization(data: { name: string; type: string; domain?: string }) {
  if (data.domain) {
    const existing = await prisma.organization.findUnique({ where: { domain: data.domain } });
    if (existing) throw new ConflictError("An organization with this domain already exists");
  }

  return prisma.organization.create({ data });
}

export async function listOrganizations(query: { page?: string; limit?: string }) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true } } },
    }),
    prisma.organization.count(),
  ]);

  return buildPaginatedResult(orgs, total, { page, limit });
}

export async function getOrganizationById(
  id: string,
  userId: string,
  role: Role,
  userOrgId: string | null,
) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, templates: true } },
      users: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        take: 50,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!org) throw new NotFoundError("Organization not found");

  if (role !== "ADMIN" && userOrgId !== id) {
    throw new ForbiddenError("You can only view your own organization");
  }

  return org;
}

export async function updateOrganization(id: string, data: { name?: string; domain?: string }) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new NotFoundError("Organization not found");

  return prisma.organization.update({ where: { id }, data });
}

export async function inviteToOrganization(orgId: string, userId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError("Organization not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  return prisma.user.update({
    where: { id: userId },
    data: { organizationId: orgId },
  });
}
