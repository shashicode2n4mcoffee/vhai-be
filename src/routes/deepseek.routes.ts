/**
 * DeepSeek routes — token for aptitude, coding, and report generation.
 */

import { Router } from "express";
import * as deepseekCtrl from "../controllers/deepseek.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { deepseekLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/token", authenticate, deepseekLimiter, asyncHandler(deepseekCtrl.getToken));

export default router;
