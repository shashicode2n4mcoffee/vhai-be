-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN "livekitObserverTokenAllowed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_settings" ADD COLUMN "livekitScreenShareEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_settings" ADD COLUMN "livekitAgentEnabled" BOOLEAN NOT NULL DEFAULT false;
