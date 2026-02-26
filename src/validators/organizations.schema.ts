import { z } from "zod";

const uuidParam = z.object({ id: z.string().uuid() });

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["company", "college"]),
  domain: z.string().max(253).optional(),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  domain: z.string().max(253).nullable().optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const inviteToOrganizationSchema = z.object({
  userId: z.string().uuid(),
});
export type InviteToOrganizationInput = z.infer<typeof inviteToOrganizationSchema>;

export const orgIdParamSchema = uuidParam;
export const listOrganizationsQuerySchema = z.object({
  page: z.string().max(10).optional(),
  limit: z.string().max(10).optional(),
});

export const updateGuardrailsSchema = z.object({
  eeoSafeMode: z.boolean().optional(),
  doNotAskTopics: z.array(z.string().max(200)).max(50).optional(),
  toxicityTerminateOnHigh: z.boolean().optional(),
});

export type UpdateGuardrailsInput = z.infer<typeof updateGuardrailsSchema>;
