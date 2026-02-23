import { z } from "zod";

export const createAssignmentSchema = z.object({
  type: z.enum(["interview", "aptitude", "coding"]),
  candidateId: z.string().uuid("Invalid candidate ID"),
  config: z.record(z.unknown()),
  deadline: z.string().datetime().optional(),
});

export const bulkCreateAssignmentSchema = z.object({
  type: z.enum(["interview", "aptitude", "coding"]),
  candidateIds: z.array(z.string().uuid()).min(1, "At least one candidate required"),
  config: z.record(z.unknown()),
  deadline: z.string().datetime().optional(),
});

export const updateAssignmentSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "EXPIRED"]).optional(),
  resultId: z.string().uuid().optional(),
  deadline: z.string().datetime().optional(),
});

export const assignmentIdParamSchema = z.object({
  id: z.string().uuid("Invalid assignment ID"),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type BulkCreateAssignmentInput = z.infer<typeof bulkCreateAssignmentSchema>;
