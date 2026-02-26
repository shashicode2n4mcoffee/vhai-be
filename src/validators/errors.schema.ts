import { z } from "zod";

/** POST /errors/log — client error reporting (optional auth) */
export const logErrorSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  details: z.string().max(10000).optional(),
  source: z.string().max(100).optional(),
  userId: z.string().uuid().optional(),
  userName: z.string().max(500).optional(),
});
export type LogErrorInput = z.infer<typeof logErrorSchema>;

/** GET /errors — list errors (admin), query params */
export const listErrorsQuerySchema = z.object({
  page: z.string().max(10).optional(),
  limit: z.string().max(10).optional(),
  source: z.string().max(100).optional(),
  userId: z.string().uuid().optional(),
});
