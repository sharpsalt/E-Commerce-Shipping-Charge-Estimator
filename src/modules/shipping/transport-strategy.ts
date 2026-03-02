/**
 * Transport Mode Strategy (Strategy Pattern)
 *
 * Determines the transport mode and rate based on distance.
 * Each transport mode implements the same interface, allowing
 * the shipping service to remain agnostic of mode-specific logic.
 *
 * New modes can be added by implementing TransportStrategy and
 * registering them in the factory — zero changes to calling code.
 */
import type { ShippingRate, TransportMode } from "@prisma/client";

// ─── Strategy Interface ──────────────────────────────

export interface TransportStrategy {
  readonly mode: TransportMode;
  readonly minDistanceKm: number;
  readonly maxDistanceKm: number | null;
  readonly ratePerKmPerKg: number;

  /** Does this strategy apply for the given distance? */
  appliesTo(distanceKm: number): boolean;

  /**
   * Calculate the base transport cost.
   * @returns cost in INR
   */
  calculateCost(distanceKm: number, weightKg: number): number;
}

// ─── Concrete Strategies ─────────────────────────────

class BaseTransportStrategy implements TransportStrategy {
  readonly mode: TransportMode;
  readonly minDistanceKm: number;
  readonly maxDistanceKm: number | null;
  readonly ratePerKmPerKg: number;

  constructor(rate: ShippingRate) {
    this.mode = rate.transportMode;
    this.minDistanceKm = rate.minDistanceKm;
    this.maxDistanceKm = rate.maxDistanceKm;
    this.ratePerKmPerKg = rate.ratePerKmPerKg;
  }

  appliesTo(distanceKm: number): boolean {
    const aboveMin = distanceKm >= this.minDistanceKm;
    const belowMax =
      this.maxDistanceKm === null || distanceKm < this.maxDistanceKm;
    return aboveMin && belowMax;
  }

  calculateCost(distanceKm: number, weightKg: number): number {
    return distanceKm * weightKg * this.ratePerKmPerKg;
  }
}

// ─── Strategy Factory ────────────────────────────────

/**
 * Build an ordered list of strategies from DB-stored rates.
 * Strategies are checked in ascending distance order, so the
 * first match wins.
 */
export function buildTransportStrategies(
  rates: ShippingRate[],
): TransportStrategy[] {
  return rates
    .slice()
    .sort((a, b) => a.minDistanceKm - b.minDistanceKm)
    .map((r) => new BaseTransportStrategy(r));
}

/**
 * Select the appropriate transport strategy for a distance.
 */
export function selectTransportStrategy(
  strategies: TransportStrategy[],
  distanceKm: number,
): TransportStrategy | null {
  return strategies.find((s) => s.appliesTo(distanceKm)) ?? null;
}
