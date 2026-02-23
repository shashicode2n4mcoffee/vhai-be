/**
 * Seed coding questions from leetcode_problems.csv and assign top US + India IT companies.
 * Run from repo root: cd backend && npx tsx prisma/seed-coding-questions.ts
 * CSV path: ../leetcode_problems.csv (relative to backend)
 */

import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import { US_COMPANIES, INDIA_IT_COMPANIES } from "./companies-data";

const prisma = new PrismaClient();

const CSV_PATH = path.resolve(process.cwd(), "..", "leetcode_problems.csv");

interface CsvRow {
  id: string;
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  translatedTitle: string;
  difficulty: string;
  paidOnly: string;
  status: string;
  isInMyFavorites: string;
  frequency: string;
  acRate: string;
  contestPoint: string;
  topicTags: string;
  topicSlugs: string;
}

function parseNum(s: string): number | null {
  if (s == null || s === "") return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

async function main() {
  console.log("Seeding coding questions and companies...\n");

  if (!fs.existsSync(CSV_PATH)) {
    console.error("CSV not found at:", CSV_PATH);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const rows: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`  Found ${rows.length} rows in CSV`);

  // ─── Create companies ─────────────────────────────────
  const companyNameToId = new Map<string, string>();

  for (const name of [...new Set(US_COMPANIES)]) {
    const c = await prisma.company.upsert({
      where: { name_country: { name, country: "US" } },
      update: {},
      create: { name, country: "US", type: "TOP_AMERICA" },
    });
    companyNameToId.set(`${name}:US`, c.id);
  }
  for (const name of [...new Set(INDIA_IT_COMPANIES)]) {
    const c = await prisma.company.upsert({
      where: { name_country: { name, country: "INDIA" } },
      update: {},
      create: { name, country: "INDIA", type: "TOP_INDIA_IT" },
    });
    companyNameToId.set(`${name}:INDIA`, c.id);
  }

  const allCompanyIds = [...companyNameToId.values()];
  console.log(`  Companies: ${allCompanyIds.length} (US + India IT)`);

  // ─── Create questions and assign companies ────────────
  const BATCH = 100;
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    for (const row of chunk) {
      const leetcodeId = parseInt(row.id, 10);
      if (Number.isNaN(leetcodeId)) continue;

      const existing = await prisma.codingQuestion.findUnique({
        where: { leetcodeId },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const questionFrontendId = parseInt(row.questionFrontendId, 10) || null;
      const paidOnly = row.paidOnly === "True" || row.paidOnly === "true";
      const frequency = parseNum(row.frequency);
      const acRate = parseNum(row.acRate);
      const contestPoint = parseNum(row.contestPoint);

      const q = await prisma.codingQuestion.create({
        data: {
          leetcodeId,
          questionFrontendId: Number.isNaN(questionFrontendId) ? null : questionFrontendId,
          title: row.title || "Untitled",
          titleSlug: row.titleSlug || `q-${leetcodeId}`,
          translatedTitle: row.translatedTitle || null,
          difficulty: row.difficulty || "MEDIUM",
          paidOnly,
          status: row.status || null,
          frequency,
          acRate,
          contestPoint,
          topicTags: row.topicTags || null,
          topicSlugs: row.topicSlugs || null,
        },
      });

      const numCompanies = 5 + Math.floor(Math.random() * 8);
      const shuffled = [...allCompanyIds].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(numCompanies, shuffled.length));

      await prisma.codingQuestionCompany.createMany({
        data: selected.map((companyId) => ({
          questionId: q.id,
          companyId,
        })),
        skipDuplicates: true,
      });

      created++;
    }
    console.log(`  Processed ${Math.min(i + BATCH, rows.length)} / ${rows.length} rows (created: ${created}, skipped: ${skipped})`);
  }

  console.log("\n  Done. Created", created, "questions; skipped", skipped, "duplicates.");
  console.log("  Each question is linked to 5–12 companies (US + India IT).\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
