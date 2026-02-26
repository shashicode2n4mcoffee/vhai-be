import { Router } from "express";
import * as livekitCtrl from "../controllers/livekit.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { generalLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/config", authenticate, generalLimiter, asyncHandler(livekitCtrl.getConfig));
router.post("/token", authenticate, generalLimiter, asyncHandler(livekitCtrl.getToken));
router.post("/quality", authenticate, generalLimiter, asyncHandler(livekitCtrl.reportQuality));

export default router;
