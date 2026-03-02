/**
 * Unit Tests – Error Classes
 */
import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  ValidationError,
  BusinessRuleError,
  ServiceUnavailableError,
  ConflictError,
} from "../../src/common/errors/index.js";

describe("AppError", () => {
  it("should set all properties correctly", () => {
    const err = new AppError("test error", 400, "TEST_ERROR");
    expect(err.message).toBe("test error");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("TEST_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("should support non-operational flag", () => {
    const err = new AppError("fatal", 500, "FATAL", false);
    expect(err.isOperational).toBe(false);
  });
});

describe("NotFoundError", () => {
  it("should produce correct message with identifier", () => {
    const err = new NotFoundError("Customer", "abc-123");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toContain("Customer");
    expect(err.message).toContain("abc-123");
  });

  it("should produce correct message without identifier", () => {
    const err = new NotFoundError("Warehouse");
    expect(err.message).toBe("Warehouse not found");
  });
});

describe("ValidationError", () => {
  it("should carry details", () => {
    const details = { field: "sellerId", issue: "required" };
    const err = new ValidationError("Invalid input", details);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual(details);
  });
});

describe("BusinessRuleError", () => {
  it("should use 422 status code", () => {
    const err = new BusinessRuleError("No transport mode available");
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("BUSINESS_RULE_VIOLATION");
  });
});

describe("ServiceUnavailableError", () => {
  it("should use 503 status code", () => {
    const err = new ServiceUnavailableError("Redis");
    expect(err.statusCode).toBe(503);
    expect(err.message).toContain("Redis");
  });
});

describe("ConflictError", () => {
  it("should use 409 status code", () => {
    const err = new ConflictError("Duplicate entry");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });
});
