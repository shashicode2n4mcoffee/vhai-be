import { Router } from "express";
import * as interviewsCtrl from "../controllers/interviews.controller.js";
import { authenticate } from "../middleware/auth.js";
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

router.post("/", requireRole("CANDIDATE", "ADMIN", "HIRING_MANAGER", "COLLEGE"), validate({ body: createInterviewSchema }), interviewsCtrl.create);
router.get("/", interviewsCtrl.list);
router.get("/:id", validate({ params: interviewIdParamSchema }), interviewsCtrl.getById);
router.put("/:id", validate({ params: interviewIdParamSchema, body: updateInterviewSchema }), interviewsCtrl.update);
router.patch("/:id/proctoring", validate({ params: interviewIdParamSchema, body: updateProctoringSchema }), interviewsCtrl.updateProctoring);
router.post("/:id/guardrails-check", validate({ params: interviewIdParamSchema, body: guardrailsCheckSchema }), interviewsCtrl.checkGuardrails);
router.delete("/:id", requireRole("ADMIN"), validate({ params: interviewIdParamSchema }), interviewsCtrl.remove);

export default router;
