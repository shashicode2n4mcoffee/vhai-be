import { z } from "zod";

export const createInterviewSchema = z.object({
  templateId: z.string().uuid("Invalid template ID"),
  interviewType: z.enum(["TECHNICAL", "HR", "BEHAVIORAL", "GENERAL"]).optional(),
});

export const updateInterviewSchema = z.object({
  transcript: z.array(z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    text: z.string(),
    timestamp: z.number(),
  })).optional(),
  report: z.record(z.unknown()).optional(),
  scoring: z.record(z.unknown()).optional(),
  videoUrl: z.string().max(1000).optional(),
  duration: z.number().int().min(0).optional(),
  overallScore: z.number().min(0).max(10).optional(),
  recommendation: z.string().max(50).optional(),
  status: z.enum(["COMPLETED", "CANCELLED"]).optional(),
});

export const updateProctoringSchema = z.object({
  proctoringFlags: z.array(z.object({
    id: z.string(),
    type: z.string(),
    timestamp: z.number(),
    message: z.string(),
    pointsAdded: z.number(),
  })).optional(),
  riskScore: z.number().min(0).max(100).optional(),
});

export const interviewIdParamSchema = z.object({
  id: z.string().uuid("Invalid interview ID"),
});

export const guardrailsCheckSchema = z.object({
  text: z.string().min(1).max(10000),
});

export const listInterviewsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  candidateId: z.string().uuid().optional(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
