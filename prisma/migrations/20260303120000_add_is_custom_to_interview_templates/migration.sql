-- AlterTable
ALTER TABLE "interview_templates" ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN NOT NULL DEFAULT false;
