import { Router } from "express";
import * as pricingCtrl from "../controllers/pricing.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/plans", asyncHandler(pricingCtrl.listPlans));

export default router;
