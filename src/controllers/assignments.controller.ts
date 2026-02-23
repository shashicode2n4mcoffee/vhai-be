/**
 * Assignments Controller — Test assignment management.
 */

import type { Request, Response, NextFunction } from "express";
import * as assignmentsService from "../services/assignments.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentsService.createAssignment(req.userId!, req.body);
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
}

export async function bulkCreate(req: Request, res: Response, next: NextFunction) {
  try {
    const assignments = await assignmentsService.bulkCreateAssignments(req.userId!, req.body);
    res.status(201).json(assignments);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assignmentsService.listAssignments(
      req.query as any,
      req.userId!,
      req.userRole!,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentsService.getAssignmentById(
      req.params.id as string,
      req.userId!,
      req.userRole!,
    );
    res.json(assignment);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await assignmentsService.updateAssignment(
      req.params.id as string,
      req.userId!,
      req.userRole!,
      req.body,
    );
    res.json(assignment);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await assignmentsService.deleteAssignment(req.params.id as string, req.userId!, req.userRole!);
    res.json({ message: "Assignment deleted" });
  } catch (error) {
    next(error);
  }
}
