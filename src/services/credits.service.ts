/**
 * Credits Service — Balance, deduct, purchase (pack creation).
 */

import { prisma } from "../config/database.js";
import { PaymentRequiredError, BadRequestError } from "../utils/errors.js";
import { PLAN_CONFIG, CREDIT_EXPIRY_YEARS } from "../config/plans.js";
import type { PlanTier, UsageType, Currency, PackStatus } from "@prisma/client";

export interface CreditBalance {
  technical: number;
  hr: number;
  behavioral: number;
  general: number;
  aptitude: number;
  coding: number;
  /** True if user has at least one ACTIVE pack with plan BUSINESS (for Settings: cloud recording option) */
  hasBusinessPlan: boolean;
}

export async function getBalance(userId: string): Promise<CreditBalance> {
  const now = new Date();
  const packs = await prisma.creditPack.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
  });

  const balance: CreditBalance = {
    technical: 0,
    hr: 0,
    behavioral: 0,
    general: 0,
    aptitude: 0,
    coding: 0,
    hasBusinessPlan: packs.some((p) => p.plan === "BUSINESS"),
  };

  for (const p of packs) {
    balance.technical += p.technicalCredits - p.usedTechnical;
    balance.hr += p.hrCredits - p.usedHr;
    balance.behavioral += p.behavioralCredits - p.usedBehavioral;
    balance.general += p.generalCredits - p.usedGeneral;
    balance.aptitude += p.aptitudeCredits - p.usedAptitude;
    balance.coding += p.codingCredits - p.usedCoding;
  }

  return balance;
}

/** Find first ACTIVE pack with at least 1 credit for the given type */
async function findPackWithCredit(
  userId: string,
  type: UsageType,
): Promise<{ id: string } | null> {
  const now = new Date();
  const packs = await prisma.creditPack.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "asc" },
  });

  for (const p of packs) {
    if (type === "TECHNICAL" && p.technicalCredits - p.usedTechnical > 0) return { id: p.id };
    if (type === "HR" && p.hrCredits - p.usedHr > 0) return { id: p.id };
    if (type === "BEHAVIORAL" && p.behavioralCredits - p.usedBehavioral > 0) return { id: p.id };
    if (type === "GENERAL" && p.generalCredits - p.usedGeneral > 0) return { id: p.id };
    if (type === "APTITUDE" && p.aptitudeCredits - p.usedAptitude > 0) return { id: p.id };
    if (type === "CODING" && p.codingCredits - p.usedCoding > 0) return { id: p.id };
  }
  return null;
}

export async function deductCredit(
  userId: string,
  type: UsageType,
  referenceId?: string,
): Promise<void> {
  const pack = await findPackWithCredit(userId, type);
  if (!pack) {
    throw new PaymentRequiredError(`No ${type.toLowerCase()} credits remaining. Purchase more at /pricing`);
  }

  const updateField =
    type === "TECHNICAL"
      ? { usedTechnical: { increment: 1 } }
      : type === "HR"
        ? { usedHr: { increment: 1 } }
        : type === "BEHAVIORAL"
          ? { usedBehavioral: { increment: 1 } }
          : type === "GENERAL"
            ? { usedGeneral: { increment: 1 } }
            : type === "APTITUDE"
              ? { usedAptitude: { increment: 1 } }
              : { usedCoding: { increment: 1 } };

  await prisma.$transaction([
    prisma.creditPack.update({
      where: { id: pack.id },
      data: updateField,
    }),
    prisma.usageLog.create({
      data: {
        userId,
        creditPackId: pack.id,
        type,
        referenceId,
      },
    }),
  ]);

  // Mark pack as EXHAUSTED if all credits used
  const updated = await prisma.creditPack.findUnique({ where: { id: pack.id } });
  if (updated) {
    const total =
      updated.technicalCredits +
      updated.hrCredits +
      updated.behavioralCredits +
      updated.generalCredits;
    const used =
      updated.usedTechnical +
      updated.usedHr +
      updated.usedBehavioral +
      updated.usedGeneral;
    const aptitudeDone = updated.usedAptitude >= updated.aptitudeCredits;
    const codingDone = updated.usedCoding >= updated.codingCredits;
    if (used >= total && aptitudeDone && codingDone) {
      await prisma.creditPack.update({
        where: { id: pack.id },
        data: { status: "EXHAUSTED" },
      });
    }
  }
}

export async function hasInterviewCredit(
  userId: string,
  interviewType: "TECHNICAL" | "HR" | "BEHAVIORAL" | "GENERAL",
): Promise<boolean> {
  const pack = await findPackWithCredit(userId, interviewType);
  return pack !== null;
}

export async function hasAptitudeCredit(userId: string): Promise<boolean> {
  return (await findPackWithCredit(userId, "APTITUDE")) !== null;
}

export async function hasCodingCredit(userId: string): Promise<boolean> {
  return (await findPackWithCredit(userId, "CODING")) !== null;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/** quantity: for USD Essential 1-9; Business 10|25|50; Enterprise 50|100|250. Ignored for INR (fixed pack). */
export async function createPack(
  userId: string,
  planKey: PlanTier,
  amountPaid: number,
  currency: Currency,
  paymentIds?: { stripe?: string; razorpayOrderId?: string; razorpayPaymentId?: string },
  quantity?: number,
): Promise<{ id: string }> {
  const key = planKey as keyof typeof PLAN_CONFIG;
  const config = PLAN_CONFIG[key];
  if (!config) throw new BadRequestError("Invalid plan");

  let technical = 0,
    hr = 0,
    behavioral = 0,
    general = 0,
    aptitude = 0,
    coding = 0;

  if (config.packSize !== undefined && config.currency === "INR") {
    const qty = config.packSize;
    const alloc = config.interviewAllocation(qty);
    technical = alloc.technical;
    hr = alloc.hr;
    behavioral = alloc.behavioral;
    general = alloc.general;
    aptitude = config.aptitudeTotal;
    coding = config.codingTotal;
  } else {
    const qty = quantity ?? config.minCredits ?? config.packSizes?.[0] ?? 1;
    const alloc = config.interviewAllocation(qty);
    technical = alloc.technical;
    hr = alloc.hr;
    behavioral = alloc.behavioral;
    general = alloc.general;
    aptitude = config.aptitudeTotal * qty;
    coding = config.codingTotal * qty;
  }

  const expiresAt = addYears(new Date(), CREDIT_EXPIRY_YEARS);

  const pack = await prisma.creditPack.create({
    data: {
      userId,
      plan: planKey,
      currency,
      technicalCredits: technical,
      hrCredits: hr,
      behavioralCredits: behavioral,
      generalCredits: general,
      aptitudeCredits: aptitude,
      codingCredits: coding,
      amountPaid,
      expiresAt,
      stripePaymentId: paymentIds?.stripe ?? null,
      razorpayOrderId: paymentIds?.razorpayOrderId ?? null,
      razorpayPaymentId: paymentIds?.razorpayPaymentId ?? null,
      status: "ACTIVE",
    },
  });

  return { id: pack.id };
}

/** Admin-only: grant a credit pack to a user without payment (amountPaid = 0). */
export async function grantPack(
  targetUserId: string,
  planKey: PlanTier,
  quantity?: number,
): Promise<{ id: string }> {
  return createPack(
    targetUserId,
    planKey,
    0,
    (PLAN_CONFIG[planKey as keyof typeof PLAN_CONFIG].currency === "INR" ? "INR" : "USD") as Currency,
    undefined,
    quantity,
  );
}

export async function listPacks(userId: string) {
  return prisma.creditPack.findMany({
    where: { userId },
    orderBy: { purchasedAt: "desc" },
  });
}

export async function getHistory(userId: string, limit = 50) {
  const logs = await prisma.usageLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      creditPack: {
        select: { plan: true, purchasedAt: true },
      },
    },
  });
  return logs;
}
