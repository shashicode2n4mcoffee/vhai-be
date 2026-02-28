import { z } from "zod";

export const createAptitudeSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(500),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Mixed"]),
  quiz: z.object({
    title: z.string(),
    questions: z.array(z.object({
      id: z.number(),
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number().int().min(0).max(3),
      explanation: z.string(),
    })),
  }),
  total: z.number().int().min(1),
});

export const updateAptitudeSchema = z.object({
  answers: z.record(z.coerce.string(), z.number()).optional(),
  score: z.number().int().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  passed: z.boolean().optional(),
  timeSpent: z.number().int().min(0).optional(),
  proctoringFlags: z.array(z.record(z.unknown())).optional(),
  riskScore: z.number().min(0).max(100).optional(),
});

export const aptitudeIdParamSchema = z.object({
  id: z.string().uuid("Invalid aptitude test ID"),
});

export type CreateAptitudeInput = z.infer<typeof createAptitudeSchema>;
export type UpdateAptitudeInput = z.infer<typeof updateAptitudeSchema>;
