-- AlterTable: add resumeSummary to user_settings (optimized 500-char resume summary for candidates)
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "resumeSummary" TEXT;
