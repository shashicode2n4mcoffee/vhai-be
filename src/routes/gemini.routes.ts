import { Router } from "express";
import * as geminiCtrl from "../controllers/gemini.controller.js";
import { authenticate } from "../middleware/auth.js";
import { geminiLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/token", authenticate, geminiLimiter, geminiCtrl.getToken);

export default router;
