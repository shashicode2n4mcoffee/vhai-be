/**
 * Interviews Service — Create, list, update, get interview sessions.
 */

import { prisma } from "../config/database.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { Role } from "@prisma/client";
import { parsePagination, buildPaginatedResult } from "../utils/pagination.js";
import type { CreateInterviewInput, UpdateInterviewInput } from "../validators/interviews.schema.js";
import * as creditsService from "./credits.service.js";
import * as orgsService from "./organizations.service.js";
import * as guardrailsService from "./guardrails.service.js";

const INTERVIEW_TYPE = ["TECHNICAL", "HR", "BEHAVIORAL", "GENERAL"] as const;
type InterviewType = (typeof INTERVIEW_TYPE)[number];

export async function createInterview(candidateId: string, input: CreateInterviewInput) {
  const interviewType: InterviewType = (input.interviewType ?? "GENERAL") as InterviewType;

  const hasCredit = await creditsService.hasInterviewCredit(candidateId, interviewType);
  if (!hasCredit) {
    throw new (await import("../utils/errors.js")).PaymentRequiredError(
      `No ${interviewType.toLowerCase()} interview credits. Purchase more at /pricing`,
    );
  }

  const template = await prisma.interviewTemplate.findUnique({
    where: { id: input.templateId },
    select: { id: true, organizationId: true },
  });
  if (!template) throw new NotFoundError("Template not found");

  await creditsService.deductCredit(candidateId, interviewType);

  const interview = await prisma.interview.create({
    data: {
      candidateId,
      templateId: input.templateId,
      interviewType,
      status: "IN_PROGRESS",
    },
    include: {
      template: true,
    },
  });

  const guardrails = await orgsService.getGuardrailsForOrg(template.organizationId);
  return { ...interview, guardrails };
}

export async function listInterviews(
  query: { page?: string; limit?: string; status?: string; candidateId?: string },
  userId: string,
  role: Role,
  orgId: string | null,
) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.status) where.status = query.status;

  if (role === "ADMIN") {
    if (query.candidateId) where.candidateId = query.candidateId;
  } else if (role === "HIRING_MANAGER" || role === "COLLEGE") {
    // See interviews for their org's candidates
    where.candidate = { organizationId: orgId };
    if (query.candidateId) where.candidateId = query.candidateId;
  } else {
    // Candidates see only their own
    where.candidateId = userId;
  }

  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        overallScore: true,
        recommendation: true,
        duration: true,
        createdAt: true,
        completedAt: true,
        candidate: { select: { id: true, name: true, email: true } },
        template: { select: { id: true, name: true } },
      },
    }),
    prisma.interview.count({ where: where as any }),
  ]);

  return buildPaginatedResult(interviews, total, { page, limit });
}

export async function getInterviewById(
  id: string,
  userId: string,
  role: Role,
  orgId: string | null,
) {
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, email: true, organizationId: true } },
      template: true,
    },
  });

  if (!interview) throw new NotFoundError("Interview not found");

  // Check access
  if (role === "ADMIN") {
    // Full access
  } else if (role === "HIRING_MANAGER" || role === "COLLEGE") {
    if (interview.candidate.organizationId !== orgId) {
      throw new ForbiddenError("You can only view interviews for your organization's candidates");
    }
  } else if (interview.candidateId !== userId) {
    throw new ForbiddenError("You can only view your own interviews");
  }

  return interview;
}

export async function updateInterview(
  id: string,
  userId: string,
  input: UpdateInterviewInput,
) {
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { template: { select: { organizationId: true } } },
  });
  if (!interview) throw new NotFoundError("Interview not found");
  if (interview.candidateId !== userId) {
    throw new ForbiddenError("You can only update your own interviews");
  }

  const data: Record<string, unknown> = {
    ...(input as any),
    ...(input.status === "COMPLETED" ? { completedAt: new Date() } : {}),
  };

  if (input.transcript && Array.isArray(input.transcript)) {
    const guardrails = await orgsService.getGuardrailsForOrg(interview.template?.organizationId ?? null);
    const transcriptEntries = input.transcript as Array<{ role: string; text: string }>;
    const result = guardrailsService.checkTranscriptGuardrails(
      transcriptEntries,
      guardrails.toxicityTerminateOnHigh,
    );
    data.guardrailFlags = result.violations.length > 0 ? result.violations : undefined;
    if (result.shouldTerminate) {
      data.terminatedByGuardrails = true;
      data.status = "CANCELLED";
      data.completedAt = new Date();
    }
  }

  return prisma.interview.update({
    where: { id },
    data,
  });
}

export async function updateProctoring(
  id: string,
  userId: string,
  data: { proctoringFlags?: unknown; riskScore?: number },
) {
  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) throw new NotFoundError("Interview not found");
  if (interview.candidateId !== userId) {
    throw new ForbiddenError("You can only update your own interviews");
  }

  return prisma.interview.update({
    where: { id },
    data: {
      proctoringFlags: data.proctoringFlags as any,
      riskScore: data.riskScore,
    },
  });
}

export async function deleteInterview(id: string) {
  const interview = await prisma.interview.findUnique({ where: { id } });
  if (!interview) throw new NotFoundError("Interview not found");
  await prisma.interview.delete({ where: { id } });
}

/** Real-time guardrails check (e.g. on each user turn). Returns whether to terminate session. */
export async function checkGuardrailsRealtime(
  interviewId: string,
  userId: string,
  text: string,
): Promise<{ terminate: boolean; reason?: string }> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { template: { select: { organizationId: true } } },
  });
  if (!interview) throw new NotFoundError("Interview not found");
  if (interview.candidateId !== userId) {
    throw new ForbiddenError("You can only access your own interviews");
  }

  const guardrails = await orgsService.getGuardrailsForOrg(interview.template?.organizationId ?? null);
  const inj = guardrailsService.detectPromptInjection(text);
  if (inj.detected) {
    return { terminate: true, reason: "Prompt injection detected" };
  }
  const tox = guardrailsService.detectToxicity(text);
  if (guardrails.toxicityTerminateOnHigh && tox.level === "high") {
    return { terminate: true, reason: "Toxicity/harassment detected" };
  }
  return { terminate: false };
}
