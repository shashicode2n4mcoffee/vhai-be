import { Router } from "express";
import * as aptitudeCtrl from "../controllers/aptitude.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createAptitudeSchema, updateAptitudeSchema, aptitudeIdParamSchema } from "../validators/aptitude.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("CANDIDATE", "ADMIN"), validate({ body: createAptitudeSchema }), asyncHandler(aptitudeCtrl.create));
router.get("/", asyncHandler(aptitudeCtrl.list));
router.get("/:id", validate({ params: aptitudeIdParamSchema }), asyncHandler(aptitudeCtrl.getById));
router.put("/:id", validate({ params: aptitudeIdParamSchema, body: updateAptitudeSchema }), asyncHandler(aptitudeCtrl.update));
router.delete("/:id", requireRole("ADMIN"), validate({ params: aptitudeIdParamSchema }), asyncHandler(aptitudeCtrl.remove));

export default router;
