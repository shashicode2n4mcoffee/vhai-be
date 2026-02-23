/**
 * Coding Questions Controller — List (paginated), get one, list companies.
 */

import type { Request, Response, NextFunction } from "express";
import * as codingQuestionsService from "../services/coding-questions.service.js";

export async function listQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await codingQuestionsService.listQuestions(req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const question = await codingQuestionsService.getQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.json(question);
  } catch (error) {
    next(error);
  }
}

export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const country = req.query.country as string | undefined;
    const companies = await codingQuestionsService.listCompanies(country);
    res.json(companies);
  } catch (error) {
    next(error);
  }
}
