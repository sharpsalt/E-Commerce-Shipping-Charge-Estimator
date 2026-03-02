/**
 * Shipping Rate Repository
 * Loads transport mode rates and delivery speed configs from the database.
 */
import type { ShippingRate, DeliverySpeedConfig, DeliverySpeed } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError } from "../../common/errors/index.js";

export class ShippingRateRepository {
  /** All active shipping rates, ordered by minDistanceKm ascending */
  async findAllActive(): Promise<ShippingRate[]> {
    return prisma.shippingRate.findMany({
      where: { isActive: true },
      orderBy: { minDistanceKm: "asc" },
    });
  }

  /** Find the delivery speed config */
  async findDeliverySpeedConfig(speed: DeliverySpeed): Promise<DeliverySpeedConfig> {
    const config = await prisma.deliverySpeedConfig.findUnique({
      where: { speed },
    });
    if (!config) {
      throw new NotFoundError("DeliverySpeedConfig", speed);
    }
    return config;
  }
}

export const shippingRateRepository = new ShippingRateRepository();
