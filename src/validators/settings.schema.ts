import { z } from "zod";

export const updateSettingsSchema = z.object({
  defaultQuestionCount: z.number().int().min(5).max(50).optional(),
  defaultDifficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  theme: z.enum(["dark", "light"]).optional(),
  notifications: z.boolean().optional(),
  /** Business plan only: enable cloud recording (LiveKit Egress to S3/GCS) */
  cloudRecordingEnabled: z.boolean().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
