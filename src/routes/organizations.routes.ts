import { Router } from "express";
import * as orgsCtrl from "../controllers/organizations.controller.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole, requireSameOrgOrAdmin } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  updateGuardrailsSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteToOrganizationSchema,
  orgIdParamSchema,
  listOrganizationsQuerySchema,
} from "../validators/organizations.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("ADMIN"), validate({ body: createOrganizationSchema }), asyncHandler(orgsCtrl.create));
router.get("/", requireRole("ADMIN"), validate({ query: listOrganizationsQuerySchema }), asyncHandler(orgsCtrl.list));
router.get("/:id", validate({ params: orgIdParamSchema }), asyncHandler(orgsCtrl.getById));
router.put("/:id", requireRole("ADMIN"), validate({ params: orgIdParamSchema, body: updateOrganizationSchema }), asyncHandler(orgsCtrl.update));
router.post(
  "/:id/invite",
  requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"),
  validate({ params: orgIdParamSchema, body: inviteToOrganizationSchema }),
  asyncHandler(orgsCtrl.invite),
);

router.get(
  "/:id/guardrails",
  requireSameOrgOrAdmin((req) => (req.params as { id?: string }).id ?? null),
  validate({ params: orgIdParamSchema }),
  asyncHandler(orgsCtrl.getGuardrails),
);
router.patch(
  "/:id/guardrails",
  requireSameOrgOrAdmin((req) => (req.params as { id?: string }).id ?? null),
  requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"),
  validate({ params: orgIdParamSchema, body: updateGuardrailsSchema }),
  asyncHandler(orgsCtrl.updateGuardrails),
);

export default router;
