import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  aiBehavior: z.string().min(1, "AI behavior is required").max(5000),
  customerWants: z.string().min(1, "Customer wants is required").max(5000),
  candidateOffers: z.string().min(1, "Candidate offers is required").max(5000),
  isPublic: z.boolean().optional().default(false),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const templateIdParamSchema = z.object({
  id: z.string().uuid("Invalid template ID"),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
