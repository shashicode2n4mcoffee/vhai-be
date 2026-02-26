import { describe, it, expect } from "vitest";
import { parsePagination, buildPaginatedResult } from "./pagination.js";

describe("parsePagination", () => {
  it("defaults to page 1 and limit 20", () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20 });
  });
  it("parses valid page and limit", () => {
    expect(parsePagination({ page: "2", limit: "10" })).toEqual({ page: 2, limit: 10 });
  });
  it("clamps limit to max 100", () => {
    expect(parsePagination({ limit: "200" })).toEqual({ page: 1, limit: 100 });
  });
  it("ensures page at least 1", () => {
    expect(parsePagination({ page: "0" })).toEqual({ page: 1, limit: 20 });
  });
  it("ignores invalid values and uses defaults", () => {
    expect(parsePagination({ page: "abc", limit: "xyz" })).toEqual({ page: 1, limit: 20 });
  });
});

describe("buildPaginatedResult", () => {
  it("builds result with hasNext/hasPrev", () => {
    const data = [{ id: "1" }];
    const result = buildPaginatedResult(data, 25, { page: 1, limit: 20 });
    expect(result.data).toEqual(data);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 25,
      totalPages: 2,
      hasNext: true,
      hasPrev: false,
    });
  });
  it("sets hasPrev on later pages", () => {
    const result = buildPaginatedResult([], 50, { page: 2, limit: 10 });
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(true);
  });
});
