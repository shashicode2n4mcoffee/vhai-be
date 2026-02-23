import { z } from "zod";

export const createCodingSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(200),
  language: z.enum(["javascript", "typescript", "python", "java", "cpp", "csharp", "go", "rust"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  problem: z.object({
    title: z.string(),
    description: z.string(),
    examples: z.array(z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional(),
    })),
    constraints: z.array(z.string()),
    starterCode: z.string(),
    language: z.string(),
    difficulty: z.string(),
    hints: z.array(z.string()),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
    })),
  }),
});

export const updateCodingSchema = z.object({
  userCode: z.string().max(50000).optional(),
  evaluation: z.record(z.unknown()).optional(),
  score: z.number().min(0).max(100).optional(),
  verdict: z.string().max(50).optional(),
  timeSpent: z.number().int().min(0).optional(),
});

export const codingIdParamSchema = z.object({
  id: z.string().uuid("Invalid coding test ID"),
});

export type CreateCodingInput = z.infer<typeof createCodingSchema>;
export type UpdateCodingInput = z.infer<typeof updateCodingSchema>;
