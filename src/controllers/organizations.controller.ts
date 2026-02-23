/**
 * Organizations Controller — Organization management.
 */

import type { Request, Response, NextFunction } from "express";
import * as orgsService from "../services/organizations.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgsService.createOrganization(req.body);
    res.status(201).json(org);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orgsService.listOrganizations(req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgsService.getOrganizationById(
      req.params.id as string,
      req.userId!,
      req.userRole!,
      req.userOrgId ?? null,
    );
    res.json(org);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await orgsService.updateOrganization(req.params.id as string, req.body);
    res.json(org);
  } catch (error) {
    next(error);
  }
}

export async function invite(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await orgsService.inviteToOrganization(req.params.id as string, req.body.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getGuardrails(req: Request, res: Response, next: NextFunction) {
  try {
    const guardrails = await orgsService.getGuardrailsForOrg(req.params.id as string);
    res.json(guardrails);
  } catch (error) {
    next(error);
  }
}

export async function updateGuardrails(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = req.params.id as string;
    const result = await orgsService.updateGuardrails(orgId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
