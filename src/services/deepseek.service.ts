/**
 * DeepSeek Service — Vends DeepSeek API config for aptitude, coding, and report generation.
 * API only accepts "deepseek-chat" or "deepseek-reasoner"; other values are normalized.
 */

import { env } from "../config/env.js";

export interface DeepSeekTokenResponse {
  apiKey: string;
  model: string;
  expiresIn: number;
  issuedAt: number;
}

const VALID_MODELS = ["deepseek-chat", "deepseek-reasoner"] as const;

function normalizeModel(value: string): string {
  const lower = value.trim().toLowerCase();
  if (VALID_MODELS.includes(lower as (typeof VALID_MODELS)[number])) return lower;
  if (lower.includes("reasoner")) return "deepseek-reasoner";
  return "deepseek-chat";
}

export function getDeepSeekToken(): DeepSeekTokenResponse | null {
  if (!env.DEEPSEEK_API_KEY) return null;
  return {
    apiKey: env.DEEPSEEK_API_KEY,
    model: normalizeModel(env.DEEPSEEK_MODEL),
    expiresIn: env.DEEPSEEK_TOKEN_TTL,
    issuedAt: Date.now(),
  };
}
