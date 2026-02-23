/**
 * Role-Based Access Control Middleware — Restricts access by user role.
 */

import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

/**
 * Restricts endpoint to specific roles.
 * Must be used AFTER authenticate middleware.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userId || !req.userRole) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!roles.includes(req.userRole)) {
      return next(new ForbiddenError(`Role '${req.userRole}' is not authorized for this action`));
    }

    next();
  };
}

/**
 * Restricts endpoint to the resource owner or specific elevated roles.
 * The `ownerIdExtractor` function pulls the owner ID from the request.
 */
export function requireOwnerOrRole(
  ownerIdExtractor: (req: Request) => string | undefined,
  ...elevatedRoles: Role[]
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userId || !req.userRole) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const ownerId = ownerIdExtractor(req);

    // Allow if user is the owner
    if (ownerId === req.userId) {
      return next();
    }

    // Allow if user has an elevated role
    if (elevatedRoles.includes(req.userRole)) {
      return next();
    }

    next(new ForbiddenError("You do not have permission to access this resource"));
  };
}

/**
 * Restricts to same organization or ADMIN.
 * Useful for HIRING_MANAGER and COLLEGE roles.
 */
export function requireSameOrgOrAdmin(
  orgIdExtractor: (req: Request) => string | null | undefined,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.userId || !req.userRole) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (req.userRole === "ADMIN") {
      return next();
    }

    const targetOrgId = orgIdExtractor(req);
    if (targetOrgId && req.userOrgId && targetOrgId === req.userOrgId) {
      return next();
    }

    next(new ForbiddenError("You can only access resources within your organization"));
  };
}
