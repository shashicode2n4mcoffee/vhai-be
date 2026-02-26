import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authLimiter, signupLimiter } from "../middleware/rateLimiter.js";
import { signupSchema, loginSchema, refreshSchema } from "../validators/auth.schema.js";

const router = Router();

router.post("/signup", signupLimiter, validate({ body: signupSchema }), asyncHandler(authCtrl.signup));
router.post("/login", authLimiter, validate({ body: loginSchema }), asyncHandler(authCtrl.login));
router.post("/refresh", validate({ body: refreshSchema }), asyncHandler(authCtrl.refresh));
router.post("/logout", authenticate, asyncHandler(authCtrl.logout));
router.get("/me", authenticate, asyncHandler(authCtrl.getMe));

export default router;
