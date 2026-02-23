import { z } from "zod";

const planTierSchema = z.enum([
  "ESSENTIAL",
  "BUSINESS",
  "ENTERPRISE",
  "LITE",
  "PRO",
  "ELITE",
]);

export const purchaseSchema = z.object({
  plan: planTierSchema,
  quantity: z.number().int().min(1).max(250).optional(),
  simulate: z.boolean().optional(),
});

export const razorpayOrderSchema = z.object({
  plan: z.enum(["LITE", "PRO", "ELITE"]),
  collegeRollNumber: z.string().max(50).optional().nullable(),
});

export const razorpayVerifySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const grantPackSchema = z.object({
  userId: z.string().uuid(),
  plan: planTierSchema,
  quantity: z.number().int().min(1).max(250).optional(),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type RazorpayOrderInput = z.infer<typeof razorpayOrderSchema>;
export type RazorpayVerifyInput = z.infer<typeof razorpayVerifySchema>;
export type GrantPackInput = z.infer<typeof grantPackSchema>;
