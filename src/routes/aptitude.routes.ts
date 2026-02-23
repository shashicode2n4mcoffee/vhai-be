import { Router } from "express";
import * as aptitudeCtrl from "../controllers/aptitude.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createAptitudeSchema, updateAptitudeSchema, aptitudeIdParamSchema } from "../validators/aptitude.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("CANDIDATE", "ADMIN"), validate({ body: createAptitudeSchema }), aptitudeCtrl.create);
router.get("/", aptitudeCtrl.list);
router.get("/:id", validate({ params: aptitudeIdParamSchema }), aptitudeCtrl.getById);
router.put("/:id", validate({ params: aptitudeIdParamSchema, body: updateAptitudeSchema }), aptitudeCtrl.update);
router.delete("/:id", requireRole("ADMIN"), validate({ params: aptitudeIdParamSchema }), aptitudeCtrl.remove);

export default router;
