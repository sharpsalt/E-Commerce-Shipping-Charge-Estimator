/**
 * Warehouse Validation Schemas (Zod)
 */
import { z } from "zod";

export const nearestWarehouseQuerySchema = z.object({
  sellerId: z.string().min(1, "sellerId is required"),
  productId: z.string().min(1, "productId is required").optional(),
});

export type NearestWarehouseQuery = z.infer<typeof nearestWarehouseQuerySchema>;
