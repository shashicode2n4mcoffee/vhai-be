/**
 * Coding Questions Service — List (paginated), get one, list companies.
 */

import { prisma } from "../config/database.js";
import { parsePagination, buildPaginatedResult, type PaginationParams } from "../utils/pagination.js";

export interface ListQuestionsQuery {
  page?: string;
  limit?: string;
  difficulty?: string;
  topic?: string;
  companyId?: string;
}

export async function listQuestions(query: ListQuestionsQuery) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.difficulty && ["EASY", "MEDIUM", "HARD"].includes(query.difficulty)) {
    where.difficulty = query.difficulty;
  }

  if (query.topic && query.topic.trim()) {
    const term = query.topic.trim().toLowerCase();
    where.OR = [
      { topicTags: { contains: term, mode: "insensitive" } },
      { topicSlugs: { contains: term.replace(/\s+/g, "-"), mode: "insensitive" } },
    ];
  }

  if (query.companyId && query.companyId.trim()) {
    where.companies = {
      some: { companyId: query.companyId.trim() },
    };
  }

  const [data, total] = await Promise.all([
    prisma.codingQuestion.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ leetcodeId: "asc" }],
      include: {
        companies: {
          include: { company: { select: { id: true, name: true, country: true, type: true } } },
        },
      },
    }),
    prisma.codingQuestion.count({ where }),
  ]);

  const items = data.map((q) => ({
    ...q,
    companies: q.companies.map((qc) => qc.company),
  }));

  return buildPaginatedResult(items, total, { page, limit });
}

export async function getQuestionById(id: string) {
  const q = await prisma.codingQuestion.findUnique({
    where: { id },
    include: {
      companies: {
        include: { company: true },
      },
    },
  });
  if (!q) return null;
  return {
    ...q,
    companies: q.companies.map((qc) => qc.company),
  };
}

export async function listCompanies(country?: string) {
  const where = country && ["US", "INDIA"].includes(country) ? { country } : {};
  return prisma.company.findMany({
    where,
    orderBy: [{ name: "asc" }],
  });
}
