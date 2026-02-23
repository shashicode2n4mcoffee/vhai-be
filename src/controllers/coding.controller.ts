/**
 * Coding Controller — Coding test management.
 */

import type { Request, Response, NextFunction } from "express";
import * as codingService from "../services/coding.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const test = await codingService.createCodingTest(req.userId!, req.body);
    res.status(201).json(test);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await codingService.listCodingTests(
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
    const test = await codingService.getCodingTestById(
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
    const test = await codingService.updateCodingTest(
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
    await codingService.deleteCodingTest(req.params.id as string);
    res.json({ message: "Coding test deleted" });
  } catch (error) {
    next(error);
  }
}
