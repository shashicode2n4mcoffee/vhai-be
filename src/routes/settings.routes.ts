import { Router } from "express";
import * as settingsCtrl from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema } from "../validators/settings.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", settingsCtrl.getSettings);
router.put("/", validate({ body: updateSettingsSchema }), settingsCtrl.updateSettings);

export default router;
