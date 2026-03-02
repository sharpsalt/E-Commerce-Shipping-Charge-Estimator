/**
 * Unit Tests – API Response Helpers
 */
import { describe, it, expect } from "vitest";
import { successResponse, errorResponse } from "../../src/common/types/index.js";

describe("successResponse", () => {
  it("should wrap data with success: true", () => {
    const result = successResponse({ foo: "bar" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ foo: "bar" });
  });

  it("should include meta when provided", () => {
    const result = successResponse({ id: 1 }, { page: 1, total: 50 });
    expect(result.meta).toEqual({ page: 1, total: 50 });
  });

  it("should not include meta when not provided", () => {
    const result = successResponse("hello");
    expect(result).not.toHaveProperty("meta");
  });
});

describe("errorResponse", () => {
  it("should wrap error with success: false", () => {
    const result = errorResponse("NOT_FOUND", "Customer not found");
    expect(result.success).toBe(false);
    expect(result.error.code).toBe("NOT_FOUND");
    expect(result.error.message).toBe("Customer not found");
  });

  it("should include details when provided", () => {
    const result = errorResponse("VALIDATION_ERROR", "Bad input", { field: "name" });
    expect(result.error.details).toEqual({ field: "name" });
  });

  it("should not include details when not provided", () => {
    const result = errorResponse("INTERNAL", "Oops");
    expect(result.error).not.toHaveProperty("details");
  });
});
