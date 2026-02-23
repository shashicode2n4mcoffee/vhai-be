/**
 * Validation Middleware — Uses Zod schemas to validate request data.
 */

import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { BadRequestError } from "../utils/errors.js";

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Record<string, string>;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; ");
        return next(new BadRequestError(`Validation failed: ${messages}`));
      }
      next(error);
    }
  };
}
