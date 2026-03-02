/**
 * Unit Tests – Math Utilities
 */
import { describe, it, expect } from "vitest";
import { roundTo } from "../../src/common/utils/math.js";

describe("roundTo", () => {
  it("should round to 2 decimal places by default", () => {
    expect(roundTo(3.14159)).toBe(3.14);
  });

  it("should round to specified decimal places", () => {
    expect(roundTo(3.14159, 3)).toBe(3.142);
    expect(roundTo(3.14159, 0)).toBe(3);
    expect(roundTo(3.14159, 1)).toBe(3.1);
  });

  it("should handle zero", () => {
    expect(roundTo(0)).toBe(0);
  });

  it("should handle negative numbers", () => {
    // IEEE 754 floating point rounding behavior
    expect(roundTo(-2.555)).toBe(-2.56);
    expect(roundTo(-3.1)).toBe(-3.1);
    expect(roundTo(-10.456, 1)).toBe(-10.5);
  });

  it("should not change already-rounded numbers", () => {
    expect(roundTo(1.5, 2)).toBe(1.5);
  });
});
