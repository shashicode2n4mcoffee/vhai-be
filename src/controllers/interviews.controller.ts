/**
 * Interviews Controller — Interview session management.
 */

import type { Request, Response, NextFunction } from "express";
import * as interviewsService from "../services/interviews.service.js";
import { logAudit } from "../middleware/auditLog.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const interview = await interviewsService.createInterview(req.userId!, req.body);
    await logAudit(req, { action: "INTERVIEW_START", resource: "interview", resourceId: interview.id });
    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await interviewsService.listInterviews(
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
    const interview = await interviewsService.getInterviewById(
      req.params.id as string,
      req.userId!,
      req.userRole!,
      req.userOrgId ?? null,
    );
    res.json(interview);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const interview = await interviewsService.updateInterview(
      req.params.id as string,
      req.userId!,
      req.body,
    );
    await logAudit(req, {
      action: "INTERVIEW_UPDATE",
      resource: "interview",
      resourceId: req.params.id as string,
    });
    res.json(interview);
  } catch (error) {
    next(error);
  }
}

export async function updateProctoring(req: Request, res: Response, next: NextFunction) {
  try {
    const interview = await interviewsService.updateProctoring(
      req.params.id as string,
      req.userId!,
      req.body,
    );
    res.json(interview);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await interviewsService.deleteInterview(req.params.id as string);
    await logAudit(req, { action: "INTERVIEW_DELETE", resource: "interview", resourceId: req.params.id as string });
    res.json({ message: "Interview deleted" });
  } catch (error) {
    next(error);
  }
}

export async function checkGuardrails(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await interviewsService.checkGuardrailsRealtime(
      req.params.id as string,
      req.userId!,
      (req.body as { text: string }).text,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}
