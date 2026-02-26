import { Router } from "express";
import * as errorsCtrl from "../controllers/errors.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logErrorSchema, listErrorsQuerySchema } from "../validators/errors.schema.js";

const router = Router();

router.post("/log", optionalAuth, validate({ body: logErrorSchema }), asyncHandler(errorsCtrl.log));
router.get("/", authenticate, requireRole("ADMIN"), validate({ query: listErrorsQuerySchema }), asyncHandler(errorsCtrl.list));

export default router;
