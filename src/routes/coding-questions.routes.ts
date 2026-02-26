/**
 * Coding Questions & Companies — Public APIs for question bank.
 */

import { Router } from "express";
import * as ctrl from "../controllers/coding-questions.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(ctrl.listQuestions));
router.get("/companies", asyncHandler(ctrl.listCompanies));
router.get("/:id", asyncHandler(ctrl.getQuestion));

export default router;
