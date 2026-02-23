/**
 * Templates Controller — Interview template CRUD.
 */

import type { Request, Response, NextFunction } from "express";
import * as templatesService from "../services/templates.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await templatesService.createTemplate(
      req.userId!,
      req.userOrgId ?? null,
      req.body,
    );
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await templatesService.listTemplates(
      req.query as any,
      req.userId!,
      req.userRole!,
      req.userOrgId ?? null,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await templatesService.getTemplateById(req.params.id as string);
    res.json(template);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await templatesService.updateTemplate(
      req.params.id as string,
      req.userId!,
      req.userRole!,
      req.body,
    );
    res.json(template);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await templatesService.deleteTemplate(req.params.id as string, req.userId!, req.userRole!);
    res.json({ message: "Template deleted" });
  } catch (error) {
    next(error);
  }
}
