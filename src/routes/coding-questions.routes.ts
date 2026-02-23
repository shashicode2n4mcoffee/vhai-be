/**
 * Coding Questions & Companies — Public APIs for question bank.
 */

import { Router } from "express";
import * as ctrl from "../controllers/coding-questions.controller.js";

const router = Router();

router.get("/", ctrl.listQuestions);
router.get("/companies", ctrl.listCompanies);
router.get("/:id", ctrl.getQuestion);

export default router;
