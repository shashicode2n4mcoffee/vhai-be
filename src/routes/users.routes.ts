import { Router } from "express";
import * as usersCtrl from "../controllers/users.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  updateProfileSchema, changePasswordSchema, changeRoleSchema,
  userIdParamSchema, listUsersQuerySchema,
} from "../validators/users.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), validate({ query: listUsersQuerySchema }), usersCtrl.listUsers);
router.get("/:id", requireRole("ADMIN", "HIRING_MANAGER", "COLLEGE"), validate({ params: userIdParamSchema }), usersCtrl.getUserById);
router.put("/profile", validate({ body: updateProfileSchema }), usersCtrl.updateProfile);
router.put("/password", validate({ body: changePasswordSchema }), usersCtrl.changePassword);
router.patch("/:id/role", requireRole("ADMIN"), validate({ params: userIdParamSchema, body: changeRoleSchema }), usersCtrl.changeRole);
router.delete("/account", usersCtrl.deleteOwnAccount);
router.delete("/:id", requireRole("ADMIN"), validate({ params: userIdParamSchema }), usersCtrl.deleteUser);

export default router;
