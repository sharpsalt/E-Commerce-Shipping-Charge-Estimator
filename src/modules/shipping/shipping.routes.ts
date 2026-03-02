/**
 * Shipping Routes
 * Registers all /api/v1/shipping-charge/* endpoints.
 */
import type { FastifyInstance } from "fastify";
import { shippingService } from "./shipping.service.js";
import {
  shippingChargeQuerySchema,
  shippingCalculateBodySchema,
  normaliseDeliverySpeed,
} from "./shipping.schema.js";
import { successResponse } from "../../common/types/index.js";
import { ValidationError } from "../../common/errors/index.js";

export async function shippingRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/shipping-charge
   * Calculate shipping charge from a warehouse to a customer.
   */
  app.get("/", async (request, reply) => {
    const parsed = shippingChargeQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid query parameters",
        parsed.error.format(),
      );
    }

    const { warehouseId, customerId, deliverySpeed, weightKg } = parsed.data;
    const speed = normaliseDeliverySpeed(deliverySpeed);

    const result = await shippingService.calculateFromWarehouse(
      warehouseId,
      customerId,
      speed,
      weightKg,
    );

    return reply.send(
      successResponse({
        shippingCharge: result.shippingCharge,
        breakdown: result.breakdown,
      }),
    );
  });

  /**
   * POST /api/v1/shipping-charge/calculate
   * End-to-end shipping calculation for a seller → customer pair.
   */
  app.post("/calculate", async (request, reply) => {
    const parsed = shippingCalculateBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid request body",
        parsed.error.format(),
      );
    }

    const { sellerId, customerId, deliverySpeed, productId } = parsed.data;
    const speed = normaliseDeliverySpeed(deliverySpeed);

    const result = await shippingService.calculateForSellerAndCustomer(
      sellerId,
      customerId,
      speed,
      productId,
    );

    return reply.send(
      successResponse({
        shippingCharge: result.shippingCharge,
        nearestWarehouse: {
          warehouseId: result.nearestWarehouse.warehouseId,
          warehouseName: result.nearestWarehouse.warehouseName,
          warehouseLocation: result.nearestWarehouse.warehouseLocation,
        },
        breakdown: result.breakdown,
      }),
    );
  });
}
