/**
 * Warehouse Service
 * Business logic for warehouse operations, including
 * finding the nearest warehouse for a seller.
 */
import type { Warehouse } from "@prisma/client";
import { warehouseRepository } from "./warehouse.repository.js";
import { sellerRepository } from "../seller/index.js";
import { findNearest, type GeoPoint } from "../../common/utils/index.js";
import { NotFoundError, BusinessRuleError } from "../../common/errors/index.js";
import { cacheAside } from "../../infrastructure/cache/index.js";
import { env } from "../../config/index.js";

export interface NearestWarehouseResult {
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: { lat: number; lng: number };
  distanceFromSellerKm: number;
}

export class WarehouseService {
  /**
   * Find the nearest operational warehouse to a seller's location.
   * Results are cached by sellerId (the seller's location rarely changes).
   */
  async findNearestForSeller(
    sellerId: string,
    _productId?: string,
  ): Promise<NearestWarehouseResult> {
    const cacheKey = `nearest-warehouse:seller:${sellerId}`;

    return cacheAside<NearestWarehouseResult>(
      cacheKey,
      env.CACHE_TTL_NEAREST_WAREHOUSE,
      async () => {
        // 1. Validate seller exists
        const seller = await sellerRepository.findById(sellerId);

        // 2. Fetch all operational warehouses
        const warehouses = await warehouseRepository.findAllOperational();
        if (warehouses.length === 0) {
          throw new BusinessRuleError(
            "No operational warehouses available in the system",
          );
        }

        // 3. Find the one nearest to the seller
        const sellerPoint: GeoPoint = { lat: seller.lat, lng: seller.lng };
        const warehousePoints = warehouses.map((w) => ({
          ...w,
          lat: w.lat,
          lng: w.lng,
        }));

        const result = findNearest(sellerPoint, warehousePoints);
        if (!result) {
          throw new NotFoundError("Nearest warehouse");
        }

        const nearest: Warehouse = result.point;
        return {
          warehouseId: nearest.id,
          warehouseName: nearest.name,
          warehouseLocation: { lat: nearest.lat, lng: nearest.lng },
          distanceFromSellerKm: result.distanceKm,
        };
      },
    );
  }
}

export const warehouseService = new WarehouseService();
