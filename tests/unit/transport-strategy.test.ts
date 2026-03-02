/**
 * Unit Tests – Transport Strategy
 * Tests the Strategy Pattern implementation for transport modes.
 */
import { describe, it, expect } from "vitest";
import { TransportMode } from "@prisma/client";
import {
  buildTransportStrategies,
  selectTransportStrategy,
  type TransportStrategy,
} from "../../src/modules/shipping/transport-strategy.js";

// Mock ShippingRate objects matching DB shape
const mockRates = [
  {
    id: "1",
    transportMode: TransportMode.MINI_VAN,
    minDistanceKm: 0,
    maxDistanceKm: 100,
    ratePerKmPerKg: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    transportMode: TransportMode.TRUCK,
    minDistanceKm: 100,
    maxDistanceKm: 500,
    ratePerKmPerKg: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    transportMode: TransportMode.AEROPLANE,
    minDistanceKm: 500,
    maxDistanceKm: null,
    ratePerKmPerKg: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("buildTransportStrategies", () => {
  it("should create strategies sorted by minDistanceKm", () => {
    // Pass them in reverse order to verify sorting
    const reversed = [...mockRates].reverse();
    const strategies = buildTransportStrategies(reversed);
    expect(strategies).toHaveLength(3);
    expect(strategies[0].mode).toBe(TransportMode.MINI_VAN);
    expect(strategies[1].mode).toBe(TransportMode.TRUCK);
    expect(strategies[2].mode).toBe(TransportMode.AEROPLANE);
  });

  it("should return empty array for no rates", () => {
    expect(buildTransportStrategies([])).toHaveLength(0);
  });
});

describe("selectTransportStrategy", () => {
  let strategies: TransportStrategy[];

  beforeEach(() => {
    strategies = buildTransportStrategies(mockRates);
  });

  it("should select MINI_VAN for 0 km", () => {
    const s = selectTransportStrategy(strategies, 0);
    expect(s).not.toBeNull();
    expect(s!.mode).toBe(TransportMode.MINI_VAN);
  });

  it("should select MINI_VAN for 50 km", () => {
    const s = selectTransportStrategy(strategies, 50);
    expect(s).not.toBeNull();
    expect(s!.mode).toBe(TransportMode.MINI_VAN);
  });

  it("should select MINI_VAN for 99.99 km (boundary)", () => {
    const s = selectTransportStrategy(strategies, 99.99);
    expect(s).not.toBeNull();
    expect(s!.mode).toBe(TransportMode.MINI_VAN);
  });

  it("should select TRUCK for exactly 100 km", () => {
    const s = selectTransportStrategy(strategies, 100);
    expect(s).not.toBeNull();
    expect(s!.mode).toBe(TransportMode.TRUCK);
  });

  it("should select TRUCK for 300 km", () => {
    const s = selectTransportStrategy(strategies, 300);
    expect(s).not.toBeNull();
    expect(s!.mode).toBe(TransportMode.TRUCK);
  });

  it("should select AEROPLANE for exactly 500 km", () => {
    const s = selectTransportStrategy(strategies, 500);
    expect(s).not.toBeNull();
    expect(s!.mode).toBe(TransportMode.AEROPLANE);
  });

  it("should select AEROPLANE for 1000 km", () => {
    const s = selectTransportStrategy(strategies, 1000);
    expect(s).not.toBeNull();
    expect(s!.mode).toBe(TransportMode.AEROPLANE);
  });

  it("should select AEROPLANE for very large distances", () => {
    const s = selectTransportStrategy(strategies, 50000);
    expect(s).not.toBeNull();
    expect(s!.mode).toBe(TransportMode.AEROPLANE);
  });

  it("should return null for empty strategies", () => {
    expect(selectTransportStrategy([], 100)).toBeNull();
  });
});

describe("TransportStrategy.calculateCost", () => {
  let strategies: TransportStrategy[];

  beforeEach(() => {
    strategies = buildTransportStrategies(mockRates);
  });

  it("MINI_VAN: 50 km, 2 kg → 50 * 2 * 3 = 300", () => {
    const s = selectTransportStrategy(strategies, 50)!;
    expect(s.calculateCost(50, 2)).toBe(300);
  });

  it("TRUCK: 200 km, 10 kg → 200 * 10 * 2 = 4000", () => {
    const s = selectTransportStrategy(strategies, 200)!;
    expect(s.calculateCost(200, 10)).toBe(4000);
  });

  it("AEROPLANE: 1000 km, 0.5 kg → 1000 * 0.5 * 1 = 500", () => {
    const s = selectTransportStrategy(strategies, 1000)!;
    expect(s.calculateCost(1000, 0.5)).toBe(500);
  });

  it("should return 0 for 0 km", () => {
    const s = selectTransportStrategy(strategies, 0)!;
    expect(s.calculateCost(0, 5)).toBe(0);
  });

  it("should return 0 for 0 weight", () => {
    const s = selectTransportStrategy(strategies, 50)!;
    expect(s.calculateCost(50, 0)).toBe(0);
  });
});
