import { Router } from "express";
import * as livekitCtrl from "../controllers/livekit.controller.js";
import { authenticate } from "../middleware/auth.js";
import { generalLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/config", authenticate, generalLimiter, livekitCtrl.getConfig);
router.post("/token", authenticate, generalLimiter, livekitCtrl.getToken);

export default router;
