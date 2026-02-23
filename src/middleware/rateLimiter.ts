/**
 * Rate Limiting Configurations — Different limits for different endpoints.
 * In NODE_ENV=test, auth/signup limits are relaxed for E2E/Playwright runs.
 */

import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const isTest = env.NODE_ENV === "test";

/** General API rate limit — 100 requests per minute */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** Auth endpoints — 10 per 15 min per IP (relaxed in test for E2E) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 500 : 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
});

/** Gemini token — 10 requests per hour per IP */
export const geminiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Gemini token rate limit exceeded. Please try again later." },
});

/** Signup limiter — 5 per hour per IP (relaxed in test for E2E) */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? 100 : 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many signup attempts. Please try again later." },
});
