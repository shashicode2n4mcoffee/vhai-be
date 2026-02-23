import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  collegeRollNumber: z.string().max(50).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
});

export const changeRoleSchema = z.object({
  role: z.enum(["ADMIN", "HIRING_MANAGER", "COLLEGE", "CANDIDATE"]),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.enum(["ADMIN", "HIRING_MANAGER", "COLLEGE", "CANDIDATE"]).optional(),
  search: z.string().max(100).optional(),
  organizationId: z.string().uuid().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
