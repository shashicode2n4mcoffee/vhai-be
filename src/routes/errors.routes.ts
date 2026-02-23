import { Router } from "express";
import * as errorsCtrl from "../controllers/errors.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

// Log an error (optional auth: we still want to log when token expired)
router.post("/log", optionalAuth, errorsCtrl.log);

// List errors — admin only
router.get("/", authenticate, requireRole("ADMIN"), errorsCtrl.list);

export default router;
