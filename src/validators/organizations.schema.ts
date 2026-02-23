import { z } from "zod";

export const updateGuardrailsSchema = z.object({
  eeoSafeMode: z.boolean().optional(),
  doNotAskTopics: z.array(z.string().max(200)).max(50).optional(),
  toxicityTerminateOnHigh: z.boolean().optional(),
});

export type UpdateGuardrailsInput = z.infer<typeof updateGuardrailsSchema>;
