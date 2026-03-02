/**
 * Warehouse Routes
 * Registers all /api/v1/warehouse/* endpoints on the Fastify instance.
 */
import type { FastifyInstance } from "fastify";
import { warehouseService } from "./warehouse.service.js";
import { nearestWarehouseQuerySchema } from "./warehouse.schema.js";
import { successResponse } from "../../common/types/index.js";
import { ValidationError } from "../../common/errors/index.js";

export async function warehouseRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/warehouse/nearest
   * Returns the nearest warehouse for a given seller.
   */
  app.get("/nearest", async (request, reply) => {
    const parsed = nearestWarehouseQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid query parameters",
        parsed.error.format(),
      );
    }

    const { sellerId, productId } = parsed.data;
    const result = await warehouseService.findNearestForSeller(
      sellerId,
      productId,
    );

    return reply.send(
      successResponse({
        warehouseId: result.warehouseId,
        warehouseName: result.warehouseName,
        warehouseLocation: result.warehouseLocation,
        distanceFromSellerKm: result.distanceFromSellerKm,
      }),
    );
  });
}
