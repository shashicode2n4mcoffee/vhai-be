import { Router } from "express";
import * as settingsCtrl from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema } from "../validators/settings.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(settingsCtrl.getSettings));
router.put("/", validate({ body: updateSettingsSchema }), asyncHandler(settingsCtrl.updateSettings));

export default router;
