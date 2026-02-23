/**
 * Pricing Controller — Public plan listing.
 */

import type { Request, Response, NextFunction } from "express";
import { PLAN_CONFIG } from "../config/plans.js";
import type { PlanTierKey } from "../config/plans.js";

export async function listPlans(_req: Request, res: Response, next: NextFunction) {
  try {
    const usdPlans: PlanTierKey[] = ["ESSENTIAL", "BUSINESS", "ENTERPRISE"];
    const inrPlans: PlanTierKey[] = ["LITE", "PRO", "ELITE"];

    const plans = {
      usd: usdPlans.map((key) => {
        const c = PLAN_CONFIG[key];
        return {
          id: key,
          name: c.name,
          description: c.description,
          currency: c.currency,
          priceDisplay: c.priceDisplay,
          amountSmallestUnit: c.amountSmallestUnit,
          packSize: c.packSize,
          packSizes: c.packSizes,
          minCredits: c.minCredits,
          maxCredits: c.maxCredits,
          interviewAllocation: c.packSize
            ? c.interviewAllocation(c.packSize)
            : c.interviewAllocation((c.packSizes?.[0] ?? c.minCredits ?? 1)),
          aptitudeTotal: c.aptitudeTotal,
          codingTotal: c.codingTotal,
          reportSections: c.reportSections,
          templates: c.templates,
        };
      }),
      inr: inrPlans.map((key) => {
        const c = PLAN_CONFIG[key];
        return {
          id: key,
          name: c.name,
          description: c.description,
          currency: c.currency,
          priceDisplay: c.priceDisplay,
          amountSmallestUnit: c.amountSmallestUnit,
          packPricePaise: c.packPricePaise,
          packSize: c.packSize,
          interviewAllocation: c.packSize
            ? c.interviewAllocation(c.packSize)
            : { technical: 0, hr: 0, behavioral: 0, general: 0 },
          aptitudeTotal: c.aptitudeTotal,
          codingTotal: c.codingTotal,
          reportSections: c.reportSections,
          templates: c.templates,
        };
      }),
    };
    res.json(plans);
  } catch (error) {
    next(error);
  }
}
