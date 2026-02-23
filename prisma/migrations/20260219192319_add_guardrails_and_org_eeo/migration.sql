-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "guardrailFlags" JSONB,
ADD COLUMN     "terminatedByGuardrails" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "doNotAskTopics" JSONB,
ADD COLUMN     "eeoSafeMode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "toxicityTerminateOnHigh" BOOLEAN NOT NULL DEFAULT true;
