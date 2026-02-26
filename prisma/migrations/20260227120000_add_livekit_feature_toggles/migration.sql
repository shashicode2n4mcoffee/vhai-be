-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN "livekitRoomMetadataEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user_settings" ADD COLUMN "livekitDataChannelEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_settings" ADD COLUMN "livekitAnalyticsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_settings" ADD COLUMN "livekitSimulcastEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "user_settings" ADD COLUMN "livekitE2EEEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "interviews" ADD COLUMN "cloudRecordingUrl" TEXT;
