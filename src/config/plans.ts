/**
 * Plan configuration per PRICING_PLAN.md
 * Amounts in smallest unit: cents (USD), paise (INR).
 */

export type PlanTierKey =
  | "ESSENTIAL"
  | "BUSINESS"
  | "ENTERPRISE"
  | "LITE"
  | "PRO"
  | "ELITE";

export interface InterviewAllocation {
  technical: number;
  hr: number;
  behavioral: number;
  general: number;
}

export interface PlanConfig {
  currency: "USD" | "INR";
  /** Display price per unit (e.g. 24.99 or 499) */
  priceDisplay: number;
  /** Amount in smallest unit (cents/paise) */
  amountSmallestUnit: number;
  /** Pack size(s): interviews in pack (USD) or fixed pack (INR) */
  packSize?: number;
  packSizes?: number[];
  minCredits?: number;
  maxCredits?: number;
  interviewAllocation: (qty: number) => InterviewAllocation;
  aptitudeTotal: number;
  codingTotal: number;
  reportSections: number;
  templates: number;
  name: string;
  description: string;
  /** For INR: total pack price in paise */
  packPricePaise?: number;
}

export const PLAN_CONFIG: Record<PlanTierKey, PlanConfig> = {
  ESSENTIAL: {
    currency: "USD",
    priceDisplay: 24.99,
    amountSmallestUnit: 2499,
    minCredits: 1,
    maxCredits: 9,
    interviewAllocation: (qty) => ({ technical: 0, hr: 0, behavioral: 0, general: qty }),
    aptitudeTotal: 3,
    codingTotal: 3,
    reportSections: 10,
    templates: 3,
    name: "Essential",
    description: "Pay per interview, best for trying out",
  },
  BUSINESS: {
    currency: "USD",
    priceDisplay: 17.99,
    amountSmallestUnit: 1799,
    packSizes: [10, 25, 50],
    minCredits: 10,
    interviewAllocation: (qty) => ({
      technical: Math.round(qty * 0.6),
      hr: Math.round(qty * 0.2),
      behavioral: qty - Math.round(qty * 0.6) - Math.round(qty * 0.2),
      general: 0,
    }),
    aptitudeTotal: 5,
    codingTotal: 5,
    reportSections: 20,
    templates: 25,
    name: "Business",
    description: "Best value for growing teams",
  },
  ENTERPRISE: {
    currency: "USD",
    priceDisplay: 12.99,
    amountSmallestUnit: 1299,
    packSizes: [50, 100, 250],
    minCredits: 50,
    interviewAllocation: (qty) => ({
      technical: Math.round(qty * 0.6),
      hr: Math.round(qty * 0.2),
      behavioral: qty - Math.round(qty * 0.6) - Math.round(qty * 0.2),
      general: 0,
    }),
    aptitudeTotal: 8,
    codingTotal: 5,
    reportSections: 20,
    templates: -1,
    name: "Enterprise",
    description: "Unlimited scale, API, multi-org",
  },
  LITE: {
    currency: "INR",
    priceDisplay: 499,
    amountSmallestUnit: 49900,
    packPricePaise: 49900,
    packSize: 1,
    interviewAllocation: () => ({ technical: 0, hr: 0, behavioral: 0, general: 1 }),
    aptitudeTotal: 3,
    codingTotal: 3,
    reportSections: 5,
    templates: 1,
    name: "Lite",
    description: "1 interview + 3 aptitude + 3 coding",
  },
  PRO: {
    currency: "INR",
    priceDisplay: 299,
    amountSmallestUnit: 29900,
    packPricePaise: 299000,
    packSize: 10,
    interviewAllocation: () => ({ technical: 6, hr: 2, behavioral: 2, general: 0 }),
    aptitudeTotal: 30,
    codingTotal: 30,
    reportSections: 20,
    templates: 10,
    name: "Pro Pack",
    description: "10 interviews + 30 aptitude + 30 coding",
  },
  ELITE: {
    currency: "INR",
    priceDisplay: 249,
    amountSmallestUnit: 24900,
    packPricePaise: 498000,
    packSize: 20,
    interviewAllocation: () => ({ technical: 12, hr: 4, behavioral: 4, general: 0 }),
    aptitudeTotal: 60,
    codingTotal: 60,
    reportSections: 20,
    templates: -1,
    name: "Elite Pack",
    description: "20 interviews + 60 aptitude + 60 coding",
  },
};

export const CREDIT_EXPIRY_YEARS = 1;
