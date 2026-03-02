/**
 * Shipping Validation Schemas (Zod)
 */
import { z } from "zod";

const deliverySpeedEnum = z.enum(["standard", "express", "STANDARD", "EXPRESS"]);

export const shippingChargeQuerySchema = z.object({
  warehouseId: z.string().min(1, "warehouseId is required"),
  customerId: z.string().min(1, "customerId is required"),
  deliverySpeed: deliverySpeedEnum.default("standard"),
  weightKg: z.coerce.number().positive().optional(),
});

export const shippingCalculateBodySchema = z.object({
  sellerId: z.string().min(1, "sellerId is required"),
  customerId: z.string().min(1, "customerId is required"),
  deliverySpeed: deliverySpeedEnum.default("standard"),
  productId: z.string().min(1).optional(),
});

export type ShippingChargeQuery = z.infer<typeof shippingChargeQuerySchema>;
export type ShippingCalculateBody = z.infer<typeof shippingCalculateBodySchema>;

/** Normalise user-facing speed string to Prisma enum value */
export function normaliseDeliverySpeed(speed: string): "STANDARD" | "EXPRESS" {
  return speed.toUpperCase() as "STANDARD" | "EXPRESS";
}
