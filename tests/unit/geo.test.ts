/**
 * Unit Tests – Geo Utilities
 * Tests the Haversine formula and nearest-point finder.
 */
import { describe, it, expect } from "vitest";
import {
  haversineDistanceKm,
  findNearest,
  type GeoPoint,
} from "../../src/common/utils/geo.js";

describe("haversineDistanceKm", () => {
  it("should return 0 for the same point", () => {
    const point: GeoPoint = { lat: 12.9716, lng: 77.5946 };
    expect(haversineDistanceKm(point, point)).toBe(0);
  });

  it("should calculate distance between Bangalore and Mumbai (~845 km)", () => {
    const bangalore: GeoPoint = { lat: 12.9716, lng: 77.5946 };
    const mumbai: GeoPoint = { lat: 19.076, lng: 72.8777 };
    const distance = haversineDistanceKm(bangalore, mumbai);
    // Approximately 845 km
    expect(distance).toBeGreaterThan(800);
    expect(distance).toBeLessThan(900);
  });

  it("should calculate distance between Delhi and Chennai (~1750 km)", () => {
    const delhi: GeoPoint = { lat: 28.6139, lng: 77.209 };
    const chennai: GeoPoint = { lat: 13.0827, lng: 80.2707 };
    const distance = haversineDistanceKm(delhi, chennai);
    expect(distance).toBeGreaterThan(1700);
    expect(distance).toBeLessThan(1800);
  });

  it("should be symmetric (a→b === b→a)", () => {
    const a: GeoPoint = { lat: 12.9716, lng: 77.5946 };
    const b: GeoPoint = { lat: 28.6139, lng: 77.209 };
    expect(haversineDistanceKm(a, b)).toBe(haversineDistanceKm(b, a));
  });

  it("should return a positive value for distinct points", () => {
    const a: GeoPoint = { lat: 0, lng: 0 };
    const b: GeoPoint = { lat: 1, lng: 1 };
    expect(haversineDistanceKm(a, b)).toBeGreaterThan(0);
  });

  it("should handle negative coordinates", () => {
    const a: GeoPoint = { lat: -33.8688, lng: 151.2093 }; // Sydney
    const b: GeoPoint = { lat: 51.5074, lng: -0.1278 }; // London
    const distance = haversineDistanceKm(a, b);
    expect(distance).toBeGreaterThan(16000);
    expect(distance).toBeLessThan(17500);
  });
});

describe("findNearest", () => {
  const origin: GeoPoint = { lat: 12.9716, lng: 77.5946 }; // Bangalore

  const warehouses: (GeoPoint & { name: string })[] = [
    { name: "Mumbai", lat: 19.076, lng: 72.8777 },
    { name: "Delhi", lat: 28.6139, lng: 77.209 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  ];

  it("should return null for empty candidates", () => {
    expect(findNearest(origin, [])).toBeNull();
  });

  it("should return the single candidate when only one exists", () => {
    const result = findNearest(origin, [warehouses[0]]);
    expect(result).not.toBeNull();
    expect(result!.point.name).toBe("Mumbai");
  });

  it("should find Chennai as nearest to Bangalore", () => {
    const result = findNearest(origin, warehouses);
    expect(result).not.toBeNull();
    // Chennai is ~290 km from Bangalore; Hyderabad ~500 km
    expect(result!.point.name).toBe("Chennai");
    expect(result!.distanceKm).toBeGreaterThan(200);
    expect(result!.distanceKm).toBeLessThan(400);
  });

  it("should return distance 0 when origin is in candidates", () => {
    const withOrigin = [{ ...origin, name: "Self" }, ...warehouses];
    const result = findNearest(origin, withOrigin);
    expect(result).not.toBeNull();
    expect(result!.distanceKm).toBe(0);
    expect(result!.point.name).toBe("Self");
  });
});
