/**
 * Unit Tests – Shipping Schema Validation
 */
import { describe, it, expect } from "vitest";
import {
  shippingChargeQuerySchema,
  shippingCalculateBodySchema,
  normaliseDeliverySpeed,
} from "../../src/modules/shipping/shipping.schema.js";

describe("shippingChargeQuerySchema", () => {
  it("should accept valid query params", () => {
    const result = shippingChargeQuerySchema.safeParse({
      warehouseId: "wh-123",
      customerId: "cust-456",
      deliverySpeed: "standard",
    });
    expect(result.success).toBe(true);
  });

  it("should default deliverySpeed to standard", () => {
    const result = shippingChargeQuerySchema.safeParse({
      warehouseId: "wh-123",
      customerId: "cust-456",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deliverySpeed).toBe("standard");
    }
  });

  it("should reject empty warehouseId", () => {
    const result = shippingChargeQuerySchema.safeParse({
      warehouseId: "",
      customerId: "cust-456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing customerId", () => {
    const result = shippingChargeQuerySchema.safeParse({
      warehouseId: "wh-123",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional weightKg as number", () => {
    const result = shippingChargeQuerySchema.safeParse({
      warehouseId: "wh-123",
      customerId: "cust-456",
      weightKg: "5.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weightKg).toBe(5.5);
    }
  });

  it("should accept EXPRESS delivery speed (case insensitive)", () => {
    const result = shippingChargeQuerySchema.safeParse({
      warehouseId: "wh-123",
      customerId: "cust-456",
      deliverySpeed: "EXPRESS",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid delivery speed", () => {
    const result = shippingChargeQuerySchema.safeParse({
      warehouseId: "wh-123",
      customerId: "cust-456",
      deliverySpeed: "overnight",
    });
    expect(result.success).toBe(false);
  });
});

describe("shippingCalculateBodySchema", () => {
  it("should accept valid body", () => {
    const result = shippingCalculateBodySchema.safeParse({
      sellerId: "seller-1",
      customerId: "cust-1",
      deliverySpeed: "express",
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional productId", () => {
    const result = shippingCalculateBodySchema.safeParse({
      sellerId: "seller-1",
      customerId: "cust-1",
      deliverySpeed: "standard",
      productId: "prod-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe("prod-1");
    }
  });

  it("should reject missing sellerId", () => {
    const result = shippingCalculateBodySchema.safeParse({
      customerId: "cust-1",
      deliverySpeed: "standard",
    });
    expect(result.success).toBe(false);
  });
});

describe("normaliseDeliverySpeed", () => {
  it("should convert 'standard' to 'STANDARD'", () => {
    expect(normaliseDeliverySpeed("standard")).toBe("STANDARD");
  });

  it("should convert 'express' to 'EXPRESS'", () => {
    expect(normaliseDeliverySpeed("express")).toBe("EXPRESS");
  });

  it("should handle already uppercase", () => {
    expect(normaliseDeliverySpeed("STANDARD")).toBe("STANDARD");
  });
});
