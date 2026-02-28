-- AlterTable
ALTER TABLE "aptitude_tests" ADD COLUMN "proctoringFlags" JSONB,
ADD COLUMN "riskScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "coding_tests" ADD COLUMN "proctoringFlags" JSONB,
ADD COLUMN "riskScore" DOUBLE PRECISION;
