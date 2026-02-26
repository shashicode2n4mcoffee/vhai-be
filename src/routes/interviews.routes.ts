import { Router } from "express";
import * as interviewsCtrl from "../controllers/interviews.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createInterviewSchema,
  updateInterviewSchema,
  updateProctoringSchema,
  interviewIdParamSchema,
  guardrailsCheckSchema,
} from "../validators/interviews.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("CANDIDATE", "ADMIN", "HIRING_MANAGER", "COLLEGE"), validate({ body: createInterviewSchema }), asyncHandler(interviewsCtrl.create));
router.get("/", asyncHandler(interviewsCtrl.list));
router.get("/:id", validate({ params: interviewIdParamSchema }), asyncHandler(interviewsCtrl.getById));
router.put("/:id", validate({ params: interviewIdParamSchema, body: updateInterviewSchema }), asyncHandler(interviewsCtrl.update));
router.patch("/:id/proctoring", validate({ params: interviewIdParamSchema, body: updateProctoringSchema }), asyncHandler(interviewsCtrl.updateProctoring));
router.post("/:id/guardrails-check", validate({ params: interviewIdParamSchema, body: guardrailsCheckSchema }), asyncHandler(interviewsCtrl.checkGuardrails));
router.delete("/:id", requireRole("ADMIN"), validate({ params: interviewIdParamSchema }), asyncHandler(interviewsCtrl.remove));

export default router;
