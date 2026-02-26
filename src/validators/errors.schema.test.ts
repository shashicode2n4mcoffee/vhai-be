import { describe, it, expect } from "vitest";
import { logErrorSchema, listErrorsQuerySchema } from "./errors.schema.js";

describe("logErrorSchema", () => {
  it("accepts valid body", () => {
    const result = logErrorSchema.safeParse({
      message: "Something broke",
      details: "stack trace here",
      source: "client",
    });
    expect(result.success).toBe(true);
  });
  it("requires message", () => {
    expect(logErrorSchema.safeParse({}).success).toBe(false);
    expect(logErrorSchema.safeParse({ message: "" }).success).toBe(false);
  });
  it("rejects message over 2000 chars", () => {
    const result = logErrorSchema.safeParse({ message: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});

describe("listErrorsQuerySchema", () => {
  it("accepts empty query", () => {
    expect(listErrorsQuerySchema.safeParse({}).success).toBe(true);
  });
  it("accepts page and limit", () => {
    expect(listErrorsQuerySchema.safeParse({ page: "1", limit: "20" }).success).toBe(true);
  });
  it("accepts source and userId", () => {
    expect(
      listErrorsQuerySchema.safeParse({
        source: "client",
        userId: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });
});
