import { describe, it, expect } from "vitest";
import { z } from "zod";

// Use the same schema shape as env.ts but without loading process.env
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
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

describe("env schema", () => {
  const valid = {
    DATABASE_URL: "postgresql://localhost:5432/test",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
    GEMINI_API_KEY: "key",
  };

  it("accepts valid minimal env", () => {
    const parsed = envSchema.parse(valid);
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.PORT).toBe(5000);
    expect(parsed.DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it("rejects missing DATABASE_URL", () => {
    const result = envSchema.safeParse({ ...valid, DATABASE_URL: "" });
    expect(result.success).toBe(false);
  });

  it("rejects short JWT_ACCESS_SECRET", () => {
    const result = envSchema.safeParse({
      ...valid,
      JWT_ACCESS_SECRET: "short",
    });
    expect(result.success).toBe(false);
  });

  it("coerces PORT string to number", () => {
    const parsed = envSchema.parse({ ...valid, PORT: "3000" });
    expect(parsed.PORT).toBe(3000);
  });
});
