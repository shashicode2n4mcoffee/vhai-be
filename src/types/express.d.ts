/**
 * Express type augmentation — adds authenticated user to Request.
 */

import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
      userOrgId?: string | null;
      requestId?: string;
    }
  }
}

export {};
