import { Router } from "express";
import * as analyticsCtrl from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard", analyticsCtrl.dashboard);
router.get("/candidates", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), analyticsCtrl.candidates);
router.get("/export", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), analyticsCtrl.exportData);

export default router;
