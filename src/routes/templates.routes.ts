import { Router } from "express";
import * as templatesCtrl from "../controllers/templates.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createTemplateSchema, updateTemplateSchema, templateIdParamSchema } from "../validators/templates.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE", "CANDIDATE"), validate({ body: createTemplateSchema }), templatesCtrl.create);
router.get("/", templatesCtrl.list);
router.get("/:id", validate({ params: templateIdParamSchema }), templatesCtrl.getById);
router.put("/:id", validate({ params: templateIdParamSchema, body: updateTemplateSchema }), templatesCtrl.update);
router.delete("/:id", validate({ params: templateIdParamSchema }), templatesCtrl.remove);

export default router;
