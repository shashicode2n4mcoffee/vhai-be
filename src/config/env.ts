/**
 * Environment Configuration — Validates all required env vars at startup.
 */

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash-native-audio-preview-12-2025"),
  GEMINI_REPORT_MODEL: z.string().default("gemini-2.5-flash-lite"),
  GEMINI_TOKEN_TTL: z.coerce.number().default(300),

  /** Comma-separated origins for CORS (e.g. production: "https://app.web.app,https://app.com") */
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  /** Request timeout in ms (default 30s). Set 0 to disable. */
  REQUEST_TIMEOUT_MS: z.coerce.number().min(0).optional(),

  /** Log Prisma queries slower than this (ms). Set 0 to disable. */
  SLOW_QUERY_MS: z.coerce.number().min(0).optional(),

  // LiveKit (optional — required for Professional video interview)
  LIVEKIT_URL: z.string().url().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
});

/** Write env validation failure to stderr (Winston not yet available; stderr is captured by log aggregators). */
function logEnvValidationFailure(errors: Record<string, string[] | undefined>): void {
  const formatted = Object.entries(errors)
    .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
    .join("\n");
  const payload = JSON.stringify({
    level: "error",
    message: "Environment validation failed",
    errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v ?? []])),
  });
  process.stderr.write(payload + "\n");
  process.stderr.write(`\n❌ Environment validation failed:\n${formatted}\n`);
}

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    logEnvValidationFailure(errors as Record<string, string[] | undefined>);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
