/**
 * Gemini Service — Securely vends Gemini API config to the frontend.
 */

import { env } from "../config/env.js";

export interface GeminiTokenResponse {
  apiKey: string;
  model: string;
  reportModel: string;
  expiresIn: number;
  issuedAt: number;
}

export function getGeminiToken(): GeminiTokenResponse {
  return {
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    reportModel: env.GEMINI_REPORT_MODEL,
    expiresIn: env.GEMINI_TOKEN_TTL,
    issuedAt: Date.now(),
  };
}
