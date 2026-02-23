/**
 * Route Aggregator — Mounts all route modules under /api.
 */

import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import geminiRoutes from "./gemini.routes.js";
import templatesRoutes from "./templates.routes.js";
import interviewsRoutes from "./interviews.routes.js";
import aptitudeRoutes from "./aptitude.routes.js";
import codingRoutes from "./coding.routes.js";
import assignmentsRoutes from "./assignments.routes.js";
import settingsRoutes from "./settings.routes.js";
import organizationsRoutes from "./organizations.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import pricingRoutes from "./pricing.routes.js";
import creditsRoutes from "./credits.routes.js";
import codingQuestionsRoutes from "./coding-questions.routes.js";
import errorsRoutes from "./errors.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/errors", errorsRoutes);
router.use("/pricing", pricingRoutes);
router.use("/credits", creditsRoutes);
router.use("/coding-questions", codingQuestionsRoutes);
router.use("/users", usersRoutes);
router.use("/gemini", geminiRoutes);
router.use("/templates", templatesRoutes);
router.use("/interviews", interviewsRoutes);
router.use("/aptitude", aptitudeRoutes);
router.use("/coding", codingRoutes);
router.use("/assignments", assignmentsRoutes);
router.use("/settings", settingsRoutes);
router.use("/organizations", organizationsRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
