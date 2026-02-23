import { Router } from "express";
import * as assignmentsCtrl from "../controllers/assignments.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createAssignmentSchema, bulkCreateAssignmentSchema,
  updateAssignmentSchema, assignmentIdParamSchema,
} from "../validators/assignments.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), validate({ body: createAssignmentSchema }), assignmentsCtrl.create);
router.post("/bulk", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), validate({ body: bulkCreateAssignmentSchema }), assignmentsCtrl.bulkCreate);
router.get("/", assignmentsCtrl.list);
router.get("/:id", validate({ params: assignmentIdParamSchema }), assignmentsCtrl.getById);
router.put("/:id", validate({ params: assignmentIdParamSchema, body: updateAssignmentSchema }), assignmentsCtrl.update);
router.delete("/:id", validate({ params: assignmentIdParamSchema }), assignmentsCtrl.remove);

export default router;
