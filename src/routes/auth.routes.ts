import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter, signupLimiter } from "../middleware/rateLimiter.js";
import { signupSchema, loginSchema, refreshSchema } from "../validators/auth.schema.js";

const router = Router();

router.post("/signup", signupLimiter, validate({ body: signupSchema }), authCtrl.signup);
router.post("/login", authLimiter, validate({ body: loginSchema }), authCtrl.login);
router.post("/refresh", validate({ body: refreshSchema }), authCtrl.refresh);
router.post("/logout", authenticate, authCtrl.logout);
router.get("/me", authenticate, authCtrl.getMe);

export default router;
