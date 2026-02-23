/**
 * Razorpay Service — Create order, verify payment, create pack for INR (student) plans.
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "../config/database.js";
import { PLAN_CONFIG } from "../config/plans.js";
import * as creditsService from "./credits.service.js";
import { BadRequestError } from "../utils/errors.js";
import type { PlanTier } from "@prisma/client";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function getClient(): Razorpay {
  if (!KEY_ID || !KEY_SECRET) {
    throw new BadRequestError("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
}

export function isRazorpayConfigured(): boolean {
  return !!(KEY_ID && KEY_SECRET);
}

const INR_PLANS = ["LITE", "PRO", "ELITE"] as const;

/** Create Razorpay order for an INR plan. Saves collegeRollNumber for CANDIDATE if provided. */
export async function createOrder(
  userId: string,
  plan: "LITE" | "PRO" | "ELITE",
  collegeRollNumber?: string | null,
): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
  if (!INR_PLANS.includes(plan)) {
    throw new BadRequestError("Only LITE, PRO, and ELITE (INR) plans are supported via Razorpay.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, collegeRollNumber: true },
  });
  if (!user) throw new BadRequestError("User not found");

  // Students (CANDIDATE) must provide college roll number for INR purchase
  if (user.role === "CANDIDATE") {
    const roll = collegeRollNumber ?? user.collegeRollNumber;
    if (!roll || !roll.trim()) {
      throw new BadRequestError("College roll number is required for students to purchase. Please provide your roll number.");
    }
    if (collegeRollNumber && collegeRollNumber.trim() !== (user.collegeRollNumber ?? "")) {
      await prisma.user.update({
        where: { id: userId },
        data: { collegeRollNumber: collegeRollNumber.trim() },
      });
    }
  }

  const config = PLAN_CONFIG[plan];
  const amountPaise = config.packPricePaise ?? config.amountSmallestUnit;

  const client = getClient();
  const receipt = `vocalhire_${userId}_${plan}`;
  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: KEY_ID!,
  };
}

/** Verify Razorpay payment signature and create credit pack. */
export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<{ packId: string }> {
  if (!KEY_SECRET) {
    throw new BadRequestError("Razorpay is not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new BadRequestError("Invalid payment signature.");
  }

  const client = getClient();
  const order = await client.orders.fetch(orderId);
  const receipt = order.receipt ?? "";
  const match = receipt.match(/^vocalhire_(.+)_(LITE|PRO|ELITE)$/);
  if (!match) {
    throw new BadRequestError("Invalid order receipt.");
  }
  const [, userId, plan] = match;

  const config = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
  if (!config || config.currency !== "INR") {
    throw new BadRequestError("Invalid plan in order.");
  }

  const amountPaid = order.amount;
  const pack = await creditsService.createPack(
    userId,
    plan as PlanTier,
    amountPaid,
    "INR",
    { razorpayOrderId: orderId, razorpayPaymentId: paymentId },
    undefined,
  );

  return { packId: pack.id };
}
