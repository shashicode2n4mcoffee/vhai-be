/**
 * Credits Controller — Balance, history, purchase, webhooks.
 */

import type { Request, Response, NextFunction } from "express";
import * as creditsService from "../services/credits.service.js";
import { PLAN_CONFIG } from "../config/plans.js";
import type { PlanTierKey } from "../config/plans.js";
import type { PlanTier, Currency } from "@prisma/client";
import type { PurchaseInput, RazorpayOrderInput, RazorpayVerifyInput, GrantPackInput } from "../validators/credits.schema.js";
import * as razorpayService from "../services/razorpay.service.js";

export async function getBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const balance = await creditsService.getBalance(req.userId!);
    res.json(balance);
  } catch (error) {
    next(error);
  }
}

export async function getPacks(req: Request, res: Response, next: NextFunction) {
  try {
    const packs = await creditsService.listPacks(req.userId!);
    res.json(packs);
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 100);
    const history = await creditsService.getHistory(req.userId!, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
}

/** Create checkout session (Stripe/Razorpay) or simulate pack for testing */
export async function purchase(req: Request, res: Response, next: NextFunction) {
  try {
    const { plan, quantity } = req.body as PurchaseInput;
    const userId = req.userId!;

    const key = plan as PlanTierKey;
    const config = PLAN_CONFIG[key];
    if (!config) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const isInr = config.currency === "INR";
    const amountPaid = isInr
      ? (config.packPricePaise ?? config.amountSmallestUnit)
      : (quantity ?? config.minCredits ?? 1) * config.amountSmallestUnit;

    if (req.body.simulate === true) {
      const pack = await creditsService.createPack(
        userId,
        plan as PlanTier,
        amountPaid,
        (config.currency === "INR" ? "INR" : "USD") as Currency,
        undefined,
        quantity,
      );
      return res.status(201).json({
        success: true,
        packId: pack.id,
        message: "Pack created (simulated). In production, use Stripe or Razorpay.",
      });
    }

    if (isInr) {
      return res.status(501).json({
        error: "Razorpay integration not configured. Use ?simulate=1 for testing.",
        upgradeUrl: "/pricing",
      });
    }

    return res.status(501).json({
      error: "Stripe integration not configured. Use ?simulate=1 for testing.",
      upgradeUrl: "/pricing",
    });
  } catch (error) {
    next(error);
  }
}

/** Stripe webhook: create pack on payment success */
export async function webhookStripe(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(501).json({ error: "Stripe webhook not implemented. Use simulate purchase." });
  } catch (error) {
    next(error);
  }
}

/** Create Razorpay order for INR plan. Students (CANDIDATE) must provide collegeRollNumber. */
export async function createRazorpayOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { plan, collegeRollNumber } = req.body as RazorpayOrderInput;
    const order = await razorpayService.createOrder(req.userId!, plan, collegeRollNumber);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

/** Verify Razorpay payment and create pack. */
export async function verifyRazorpayPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId, paymentId, signature } = req.body as RazorpayVerifyInput;
    const result = await razorpayService.verifyPayment(orderId, paymentId, signature);
    res.status(200).json({ success: true, packId: result.packId });
  } catch (error) {
    next(error);
  }
}

/** Admin-only: grant a credit pack to a user without payment */
export async function grantPack(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, plan, quantity } = req.body as GrantPackInput;
    const pack = await creditsService.grantPack(userId, plan as PlanTier, quantity);
    res.status(201).json({ success: true, packId: pack.id, message: "Pack granted successfully." });
  } catch (error) {
    next(error);
  }
}

/** Razorpay webhook: create pack on payment success */
export async function webhookRazorpay(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(501).json({ error: "Razorpay webhook not implemented. Use client verify flow." });
  } catch (error) {
    next(error);
  }
}
