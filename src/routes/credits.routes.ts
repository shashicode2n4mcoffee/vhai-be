import { Router } from "express";
import * as creditsCtrl from "../controllers/credits.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { purchaseSchema, razorpayOrderSchema, razorpayVerifySchema, grantPackSchema } from "../validators/credits.schema.js";

const router = Router();

router.get("/balance", authenticate, asyncHandler(creditsCtrl.getBalance));
router.get("/packs", authenticate, asyncHandler(creditsCtrl.getPacks));
router.get("/history", authenticate, asyncHandler(creditsCtrl.getHistory));
router.post("/purchase", authenticate, validate({ body: purchaseSchema }), asyncHandler(creditsCtrl.purchase));
router.post("/razorpay/order", authenticate, validate({ body: razorpayOrderSchema }), asyncHandler(creditsCtrl.createRazorpayOrder));
router.post("/razorpay/verify", authenticate, validate({ body: razorpayVerifySchema }), asyncHandler(creditsCtrl.verifyRazorpayPayment));
router.post("/grant", authenticate, requireRole("ADMIN"), validate({ body: grantPackSchema }), asyncHandler(creditsCtrl.grantPack));

router.post("/webhook/stripe", asyncHandler(creditsCtrl.webhookStripe));
router.post("/webhook/razorpay", asyncHandler(creditsCtrl.webhookRazorpay));

export default router;
