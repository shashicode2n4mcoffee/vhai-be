import { Router } from "express";
import * as creditsCtrl from "../controllers/credits.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { purchaseSchema, razorpayOrderSchema, razorpayVerifySchema, grantPackSchema } from "../validators/credits.schema.js";

const router = Router();

router.get("/balance", authenticate, creditsCtrl.getBalance);
router.get("/packs", authenticate, creditsCtrl.getPacks);
router.get("/history", authenticate, creditsCtrl.getHistory);
router.post("/purchase", authenticate, validate({ body: purchaseSchema }), creditsCtrl.purchase);
router.post("/razorpay/order", authenticate, validate({ body: razorpayOrderSchema }), creditsCtrl.createRazorpayOrder);
router.post("/razorpay/verify", authenticate, validate({ body: razorpayVerifySchema }), creditsCtrl.verifyRazorpayPayment);
router.post("/grant", authenticate, requireRole("ADMIN"), validate({ body: grantPackSchema }), creditsCtrl.grantPack);

router.post("/webhook/stripe", creditsCtrl.webhookStripe);
router.post("/webhook/razorpay", creditsCtrl.webhookRazorpay);

export default router;
