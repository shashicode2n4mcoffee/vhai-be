/**
 * Users Controller — Profile management, user listing, role changes.
 */

import type { Request, Response, NextFunction } from "express";
import * as usersService from "../services/users.service.js";
import { logAudit } from "../middleware/auditLog.js";

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.listUsers(
      req.query as any,
      req.userRole!,
      req.userOrgId ?? null,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params.id as string);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateProfile(req.userId!, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.changePassword(
      req.userId!,
      req.body.currentPassword,
      req.body.newPassword,
    );
    await logAudit(req, { action: "PASSWORD_CHANGE", resource: "user", resourceId: req.userId });
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
}

export async function changeRole(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.changeRole(req.params.id as string, req.body.role);
    await logAudit(req, {
      action: "ROLE_CHANGE",
      resource: "user",
      resourceId: req.params.id as string,
      details: { newRole: req.body.role },
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.softDeleteUser(req.params.id as string);
    await logAudit(req, { action: "USER_DELETE", resource: "user", resourceId: req.params.id as string });
    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    next(error);
  }
}

export async function deleteOwnAccount(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deleteOwnAccount(req.userId!, req.body.password);
    await logAudit(req, { action: "ACCOUNT_DELETE", resource: "user", resourceId: req.userId });
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
}
