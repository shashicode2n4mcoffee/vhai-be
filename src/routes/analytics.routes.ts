import { Router } from "express";
import * as analyticsCtrl from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard", asyncHandler(analyticsCtrl.dashboard));
router.get("/candidates", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), asyncHandler(analyticsCtrl.candidates));
router.get("/export", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), asyncHandler(analyticsCtrl.exportData));

export default router;
