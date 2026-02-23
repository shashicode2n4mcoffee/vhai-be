/**
 * Analytics Service — Dashboard stats, candidate overviews, exports.
 */

import { prisma } from "../config/database.js";
import type { Role } from "@prisma/client";

export async function getDashboardStats(userId: string, role: Role, orgId: string | null) {
  const candidateWhere = buildCandidateFilter(userId, role, orgId);

  const [
    totalInterviews,
    completedInterviews,
    totalAptitude,
    totalCoding,
    totalUsers,
    avgInterviewScore,
    avgAptitudeScore,
    avgCodingScore,
    recentInterviews,
    recentAptitude,
    recentCoding,
  ] = await Promise.all([
    prisma.interview.count({ where: candidateWhere }),
    prisma.interview.count({ where: { ...candidateWhere, status: "COMPLETED" } }),
    prisma.aptitudeTest.count({ where: { ...candidateWhere, completedAt: { not: null } } }),
    prisma.codingTest.count({ where: { ...candidateWhere, completedAt: { not: null } } }),
    role === "ADMIN"
      ? prisma.user.count({ where: { isActive: true } })
      : role === "HIRING_MANAGER" || role === "COLLEGE"
        ? prisma.user.count({ where: { organizationId: orgId, isActive: true } })
        : Promise.resolve(0),
    prisma.interview.aggregate({
      where: { ...candidateWhere, overallScore: { not: null } },
      _avg: { overallScore: true },
    }),
    prisma.aptitudeTest.aggregate({
      where: { ...candidateWhere, percentage: { not: null } },
      _avg: { percentage: true },
    }),
    prisma.codingTest.aggregate({
      where: { ...candidateWhere, score: { not: null } },
      _avg: { score: true },
    }),
    prisma.interview.findMany({
      where: candidateWhere,
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, overallScore: true, recommendation: true, createdAt: true,
        candidate: { select: { name: true } },
        template: { select: { name: true } },
      },
    }),
    prisma.aptitudeTest.findMany({
      where: { ...candidateWhere, completedAt: { not: null } },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, topic: true, score: true, total: true,
        percentage: true, passed: true, createdAt: true,
        candidate: { select: { name: true } },
      },
    }),
    prisma.codingTest.findMany({
      where: { ...candidateWhere, completedAt: { not: null } },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, topic: true, language: true, score: true,
        verdict: true, createdAt: true,
        candidate: { select: { name: true } },
      },
    }),
  ]);

  return {
    stats: {
      totalInterviews,
      completedInterviews,
      totalAptitude,
      totalCoding,
      totalUsers,
      avgInterviewScore: round(avgInterviewScore._avg.overallScore || 0),
      avgAptitudeScore: round(avgAptitudeScore._avg.percentage || 0),
      avgCodingScore: round(avgCodingScore._avg.score || 0),
    },
    recent: {
      interviews: recentInterviews,
      aptitude: recentAptitude,
      coding: recentCoding,
    },
  };
}

export async function getCandidateOverview(
  userId: string,
  role: Role,
  orgId: string | null,
  query: { page?: string; limit?: string },
) {
  const where: Record<string, unknown> = { isActive: true, role: "CANDIDATE" };

  if (role === "HIRING_MANAGER" || role === "COLLEGE") {
    where.organizationId = orgId;
  }

  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || "20", 10)));
  const skip = (page - 1) * limit;

  const candidates = await prisma.user.findMany({
    where: where as any,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          interviews: true,
          aptitudeTests: true,
          codingTests: true,
        },
      },
    },
  });

  const total = await prisma.user.count({ where: where as any });

  return {
    data: candidates,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getExportData(
  userId: string,
  role: Role,
  orgId: string | null,
  type: string,
) {
  const candidateWhere = buildCandidateFilter(userId, role, orgId);

  if (type === "interviews") {
    return prisma.interview.findMany({
      where: { ...candidateWhere, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, overallScore: true, recommendation: true,
        duration: true, createdAt: true, completedAt: true,
        candidate: { select: { name: true, email: true } },
        template: { select: { name: true } },
      },
    });
  }

  if (type === "aptitude") {
    return prisma.aptitudeTest.findMany({
      where: { ...candidateWhere, completedAt: { not: null } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, topic: true, difficulty: true,
        score: true, total: true, percentage: true, passed: true,
        createdAt: true,
        candidate: { select: { name: true, email: true } },
      },
    });
  }

  if (type === "coding") {
    return prisma.codingTest.findMany({
      where: { ...candidateWhere, completedAt: { not: null } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, topic: true, language: true, difficulty: true,
        score: true, verdict: true, timeSpent: true,
        createdAt: true,
        candidate: { select: { name: true, email: true } },
      },
    });
  }

  return [];
}

// ─── Helpers ────────────────────────────────────────────

function buildCandidateFilter(userId: string, role: Role, orgId: string | null) {
  if (role === "ADMIN") return {};
  if (role === "HIRING_MANAGER" || role === "COLLEGE") {
    return { candidate: { organizationId: orgId } };
  }
  return { candidateId: userId };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
