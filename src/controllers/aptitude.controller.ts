/**
 * Aptitude Controller — Aptitude test management.
 */

import type { Request, Response, NextFunction } from "express";
import * as aptitudeService from "../services/aptitude.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const test = await aptitudeService.createAptitudeTest(req.userId!, req.body);
    res.status(201).json(test);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await aptitudeService.listAptitudeTests(
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
    const test = await aptitudeService.getAptitudeTestById(
      req.params.id as string,
      req.userId!,
      req.userRole!,
      req.userOrgId ?? null,
    );
    res.json(test);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const test = await aptitudeService.updateAptitudeTest(
      req.params.id as string,
      req.userId!,
      req.body,
    );
    res.json(test);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await aptitudeService.deleteAptitudeTest(req.params.id as string);
    res.json({ message: "Aptitude test deleted" });
  } catch (error) {
    next(error);
  }
}
