import { Router } from "express";
import * as orgsCtrl from "../controllers/organizations.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole, requireSameOrgOrAdmin } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { updateGuardrailsSchema } from "../validators/organizations.schema.js";
import { z } from "zod";

const router = Router();

router.use(authenticate);

router.post("/", requireRole("ADMIN"), orgsCtrl.create);
router.get("/", requireRole("ADMIN"), orgsCtrl.list);
router.get("/:id", orgsCtrl.getById);
router.put("/:id", requireRole("ADMIN"), orgsCtrl.update);
router.post("/:id/invite", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), orgsCtrl.invite);

const orgIdParamSchema = z.object({ id: z.string().uuid() });
router.get(
  "/:id/guardrails",
  requireSameOrgOrAdmin((req) => (req.params as { id?: string }).id ?? null),
  validate({ params: orgIdParamSchema }),
  orgsCtrl.getGuardrails,
);
router.patch(
  "/:id/guardrails",
  requireSameOrgOrAdmin((req) => (req.params as { id?: string }).id ?? null),
  requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"),
  validate({ params: orgIdParamSchema, body: updateGuardrailsSchema }),
  orgsCtrl.updateGuardrails,
);

export default router;
