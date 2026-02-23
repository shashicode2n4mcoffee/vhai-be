-- CreateTable
CREATE TABLE "coding_questions" (
    "id" TEXT NOT NULL,
    "leetcodeId" INTEGER NOT NULL,
    "questionFrontendId" INTEGER,
    "title" TEXT NOT NULL,
    "titleSlug" TEXT NOT NULL,
    "translatedTitle" TEXT,
    "difficulty" TEXT NOT NULL,
    "paidOnly" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,
    "frequency" DOUBLE PRECISION,
    "acRate" DOUBLE PRECISION,
    "contestPoint" DOUBLE PRECISION,
    "topicTags" TEXT,
    "topicSlugs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_question_companies" (
    "questionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "coding_question_companies_pkey" PRIMARY KEY ("questionId","companyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "coding_questions_leetcodeId_key" ON "coding_questions"("leetcodeId");

-- CreateIndex
CREATE UNIQUE INDEX "coding_questions_titleSlug_key" ON "coding_questions"("titleSlug");

-- CreateIndex
CREATE INDEX "coding_questions_difficulty_idx" ON "coding_questions"("difficulty");

-- CreateIndex
CREATE INDEX "coding_questions_titleSlug_idx" ON "coding_questions"("titleSlug");

-- CreateIndex
CREATE INDEX "companies_country_idx" ON "companies"("country");

-- CreateIndex
CREATE INDEX "companies_type_idx" ON "companies"("type");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_country_key" ON "companies"("name", "country");

-- CreateIndex
CREATE INDEX "coding_question_companies_companyId_idx" ON "coding_question_companies"("companyId");

-- AddForeignKey
ALTER TABLE "coding_question_companies" ADD CONSTRAINT "coding_question_companies_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_question_companies" ADD CONSTRAINT "coding_question_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
