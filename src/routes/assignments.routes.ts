import { Router } from "express";
import * as assignmentsCtrl from "../controllers/assignments.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createAssignmentSchema, bulkCreateAssignmentSchema,
  updateAssignmentSchema, assignmentIdParamSchema,
} from "../validators/assignments.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), validate({ body: createAssignmentSchema }), asyncHandler(assignmentsCtrl.create));
router.post("/bulk", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), validate({ body: bulkCreateAssignmentSchema }), asyncHandler(assignmentsCtrl.bulkCreate));
router.get("/", asyncHandler(assignmentsCtrl.list));
router.get("/:id", validate({ params: assignmentIdParamSchema }), asyncHandler(assignmentsCtrl.getById));
router.put("/:id", validate({ params: assignmentIdParamSchema, body: updateAssignmentSchema }), asyncHandler(assignmentsCtrl.update));
router.delete("/:id", validate({ params: assignmentIdParamSchema }), asyncHandler(assignmentsCtrl.remove));

export default router;
