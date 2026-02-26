import { Router } from "express";
import * as codingCtrl from "../controllers/coding.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createCodingSchema, updateCodingSchema, codingIdParamSchema } from "../validators/coding.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("CANDIDATE", "ADMIN"), validate({ body: createCodingSchema }), asyncHandler(codingCtrl.create));
router.get("/", asyncHandler(codingCtrl.list));
router.get("/:id", validate({ params: codingIdParamSchema }), asyncHandler(codingCtrl.getById));
router.put("/:id", validate({ params: codingIdParamSchema, body: updateCodingSchema }), asyncHandler(codingCtrl.update));
router.delete("/:id", requireRole("ADMIN"), validate({ params: codingIdParamSchema }), asyncHandler(codingCtrl.remove));

export default router;
