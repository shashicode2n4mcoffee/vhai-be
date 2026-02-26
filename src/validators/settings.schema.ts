import { z } from "zod";

export const updateSettingsSchema = z.object({
  defaultQuestionCount: z.number().int().min(5).max(50).optional(),
  defaultDifficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  theme: z.enum(["dark", "light"]).optional(),
  notifications: z.boolean().optional(),
  /** Business plan only: enable cloud recording (LiveKit Egress to S3/GCS) */
  cloudRecordingEnabled: z.boolean().optional(),
  /** P1: set room metadata (interviewId, templateId) when creating LiveKit room */
  livekitRoomMetadataEnabled: z.boolean().optional(),
  /** P2: send transcript/signals over LiveKit data channel */
  livekitDataChannelEnabled: z.boolean().optional(),
  /** P2: send connection quality samples to backend for analytics */
  livekitAnalyticsEnabled: z.boolean().optional(),
  /** P3: use simulcast for adaptive video quality */
  livekitSimulcastEnabled: z.boolean().optional(),
  /** P3: enable end-to-end encryption for LiveKit room */
  livekitE2EEEnabled: z.boolean().optional(),
  /** Allow HR to get observer (view-only) token for interview rooms */
  livekitObserverTokenAllowed: z.boolean().optional(),
  /** Allow candidate to share screen in Professional interview */
  livekitScreenShareEnabled: z.boolean().optional(),
  /** Dispatch LiveKit Agent to room (requires LIVEKIT_AGENT_NAME) */
  livekitAgentEnabled: z.boolean().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
