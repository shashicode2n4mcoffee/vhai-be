-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('ESSENTIAL', 'BUSINESS', 'ENTERPRISE', 'LITE', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'INR');

-- CreateEnum
CREATE TYPE "PackStatus" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('TECHNICAL', 'HR', 'BEHAVIORAL', 'GENERAL', 'APTITUDE', 'CODING');

-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "interviewType" TEXT;

-- CreateTable
CREATE TABLE "credit_packs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL,
    "currency" "Currency" NOT NULL,
    "technicalCredits" INTEGER NOT NULL DEFAULT 0,
    "hrCredits" INTEGER NOT NULL DEFAULT 0,
    "behavioralCredits" INTEGER NOT NULL DEFAULT 0,
    "generalCredits" INTEGER NOT NULL DEFAULT 0,
    "usedTechnical" INTEGER NOT NULL DEFAULT 0,
    "usedHr" INTEGER NOT NULL DEFAULT 0,
    "usedBehavioral" INTEGER NOT NULL DEFAULT 0,
    "usedGeneral" INTEGER NOT NULL DEFAULT 0,
    "aptitudeCredits" INTEGER NOT NULL DEFAULT 0,
    "codingCredits" INTEGER NOT NULL DEFAULT 0,
    "usedAptitude" INTEGER NOT NULL DEFAULT 0,
    "usedCoding" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "stripePaymentId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpayOrderId" TEXT,
    "status" "PackStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creditPackId" TEXT NOT NULL,
    "type" "UsageType" NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_packs_userId_idx" ON "credit_packs"("userId");

-- CreateIndex
CREATE INDEX "credit_packs_status_idx" ON "credit_packs"("status");

-- CreateIndex
CREATE INDEX "credit_packs_expiresAt_idx" ON "credit_packs"("expiresAt");

-- CreateIndex
CREATE INDEX "usage_logs_userId_idx" ON "usage_logs"("userId");

-- CreateIndex
CREATE INDEX "usage_logs_creditPackId_idx" ON "usage_logs"("creditPackId");

-- CreateIndex
CREATE INDEX "usage_logs_type_idx" ON "usage_logs"("type");

-- AddForeignKey
ALTER TABLE "credit_packs" ADD CONSTRAINT "credit_packs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_creditPackId_fkey" FOREIGN KEY ("creditPackId") REFERENCES "credit_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
