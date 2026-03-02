/**
 * Shipping Service
 * Core business logic for calculating shipping charges.
 *
 * Combines:
 *  - Distance calculation (Haversine)
 *  - Transport mode selection (Strategy Pattern)
 *  - Delivery speed surcharges
 *  - Response caching (Cache-aside)
 */
import type { DeliverySpeed } from "@prisma/client";
import { shippingRateRepository } from "./shipping-rate.repository.js";
import {
  buildTransportStrategies,
  selectTransportStrategy,
} from "./transport-strategy.js";
import { warehouseRepository } from "../warehouse/warehouse.repository.js";
import { warehouseService, type NearestWarehouseResult } from "../warehouse/index.js";
import { customerRepository } from "../customer/index.js";
import { sellerRepository } from "../seller/index.js";
import { productRepository } from "../product/index.js";
import { haversineDistanceKm, roundTo, type GeoPoint } from "../../common/utils/index.js";
import { BusinessRuleError } from "../../common/errors/index.js";
import { cacheAside } from "../../infrastructure/cache/index.js";
import { env } from "../../config/index.js";

// ─── Helper type ─────────────────────────────────────

/** String-literal union matching the DeliverySpeed enum values */
type DeliverySpeedValue = "STANDARD" | "EXPRESS";

// ─── Result DTOs ─────────────────────────────────────

export interface ShippingChargeResult {
  shippingCharge: number;
  breakdown: {
    distanceKm: number;
    transportMode: string;
    transportCost: number;
    baseCourierCharge: number;
    expressExtraCharge: number;
    totalWeight: number;
    deliverySpeed: string;
  };
}

export interface FullShippingCalculationResult {
  shippingCharge: number;
  nearestWarehouse: NearestWarehouseResult;
  breakdown: ShippingChargeResult["breakdown"];
}

// ─── Service ─────────────────────────────────────────

export class ShippingService {
  /**
   * Calculate shipping charge from a warehouse to a customer.
   *
   * This powers the `GET /api/v1/shipping-charge` endpoint.
   * It needs the warehouse, customer, delivery speed, and the total
   * weight of items being shipped.
   */
  async calculateFromWarehouse(
    warehouseId: string,
    customerId: string,
    deliverySpeed: DeliverySpeedValue,
    totalWeightKg?: number,
  ): Promise<ShippingChargeResult> {
    const cacheKey = `shipping-charge:${warehouseId}:${customerId}:${deliverySpeed}:${totalWeightKg ?? "default"}`;

    return cacheAside<ShippingChargeResult>(
      cacheKey,
      env.CACHE_TTL_SHIPPING_CHARGE,
      async () => {
        // 1. Resolve entities
        const warehouse = await warehouseRepository.findById(warehouseId);
        const customer = await customerRepository.findById(customerId);

        // 2. Calculate distance
        const warehousePoint: GeoPoint = { lat: warehouse.lat, lng: warehouse.lng };
        const customerPoint: GeoPoint = { lat: customer.lat, lng: customer.lng };
        const distanceKm = haversineDistanceKm(warehousePoint, customerPoint);

        // Use a default weight if not provided (e.g., for the simple 2-param API)
        const weightKg = totalWeightKg ?? 1;

        // 3. Determine transport mode using Strategy Pattern
        const rates = await shippingRateRepository.findAllActive();
        const strategies = buildTransportStrategies(rates);
        const strategy = selectTransportStrategy(strategies, distanceKm);

        if (!strategy) {
          throw new BusinessRuleError(
            `No transport mode available for distance ${distanceKm} km. ` +
            `Delivery to this customer's location is not supported.`,
          );
        }

        // 4. Base transport cost
        const transportCost = roundTo(strategy.calculateCost(distanceKm, weightKg));

        // 5. Delivery speed surcharge
        const speedConfig = await shippingRateRepository.findDeliverySpeedConfig(deliverySpeed as DeliverySpeed);
        const baseCourierCharge = speedConfig.baseCourierChargeINR;
        const expressExtraCharge = roundTo(speedConfig.extraChargePerKg * weightKg);

        // 6. Total
        const shippingCharge = roundTo(baseCourierCharge + expressExtraCharge + transportCost);

        return {
          shippingCharge,
          breakdown: {
            distanceKm,
            transportMode: strategy.mode,
            transportCost,
            baseCourierCharge,
            expressExtraCharge,
            totalWeight: weightKg,
            deliverySpeed,
          },
        };
      },
    );
  }

  /**
   * End-to-end shipping calculation for a seller → customer pair.
   *
   * This powers the `POST /api/v1/shipping-charge/calculate` endpoint.
   * It orchestrates:
   *   1. Finds the seller's product(s) and total weight
   *   2. Finds the nearest warehouse for the seller
   *   3. Calculates the shipping charge from warehouse → customer
   */
  async calculateForSellerAndCustomer(
    sellerId: string,
    customerId: string,
    deliverySpeed: DeliverySpeedValue,
    productId?: string,
  ): Promise<FullShippingCalculationResult> {
    // 1. Validate seller exists
    await sellerRepository.findById(sellerId);

    // 2. Determine total weight
    let totalWeightKg: number;
    if (productId) {
      const product = await productRepository.findBySellerAndProductId(sellerId, productId);
      totalWeightKg = product.weightKg;
    } else {
      // If no specific product, use a default weight of 1 kg
      // In a real system, this would come from the cart/order
      totalWeightKg = 1;
    }

    // 3. Find nearest warehouse
    const nearestWarehouse = await warehouseService.findNearestForSeller(sellerId);

    // 4. Calculate shipping from that warehouse to the customer
    const chargeResult = await this.calculateFromWarehouse(
      nearestWarehouse.warehouseId,
      customerId,
      deliverySpeed,
      totalWeightKg,
    );

    return {
      shippingCharge: chargeResult.shippingCharge,
      nearestWarehouse,
      breakdown: chargeResult.breakdown,
    };
  }
}

export const shippingService = new ShippingService();
