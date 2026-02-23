import { Router } from "express";
import * as pricingCtrl from "../controllers/pricing.controller.js";

const router = Router();

router.get("/plans", pricingCtrl.listPlans);

export default router;
