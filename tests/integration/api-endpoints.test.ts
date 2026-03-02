/**
 * Integration Tests — API Endpoints
 *
 * Tests the full Fastify HTTP layer for all 3 shipping API endpoints
 * plus the health-check endpoint.
 *
 * Strategy:
 *  - Mock the infrastructure layer (cache → passthrough, database → stubs)
 *  - Use Fastify's `inject()` for real HTTP-level tests without a running server
 *  - Validate response status codes, envelopes, and business logic outputs
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";

// ─── Mock env BEFORE any app module is imported ─────────────

vi.mock("../../src/config/env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    HOST: "0.0.0.0",
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    REDIS_HOST: "localhost",
    REDIS_PORT: 6379,
    REDIS_PASSWORD: "",
    REDIS_DB: 0,
    CACHE_TTL_NEAREST_WAREHOUSE: 300,
    CACHE_TTL_SHIPPING_CHARGE: 60,
  },
}));

// ─── Mock Redis / cache layer (passthrough — no real Redis) ──

vi.mock("../../src/infrastructure/cache/redis.js", () => {
  return {
    CacheClient: {
      getInstance: () => ({
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        deletePattern: vi.fn().mockResolvedValue(undefined),
        getRawClient: () => ({
          connect: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      disconnect: vi.fn().mockResolvedValue(undefined),
    },
    getRedisClient: () => ({ connect: vi.fn() }),
    cacheGet: vi.fn().mockResolvedValue(null),
    cacheSet: vi.fn().mockResolvedValue(undefined),
    cacheDelete: vi.fn().mockResolvedValue(undefined),
    cacheAside: vi.fn().mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) =>
        fetcher(),
    ),
    disconnectRedis: vi.fn().mockResolvedValue(undefined),
  };
});

// ─── Mock Prisma database client ─────────────────────────

vi.mock("../../src/infrastructure/database/prisma.js", () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    warehouse: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    seller: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    shippingRate: {
      findMany: vi.fn(),
    },
    deliverySpeedConfig: {
      findUnique: vi.fn(),
    },
  },
  DatabaseClient: {
    getInstance: () => ({ getClient: () => ({}) }),
    disconnect: vi.fn(),
  },
}));

// ─── Import app builder AFTER mocks are in place ────────

import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

// ─── Shared mock data ───────────────────────────────────

const MOCK_WAREHOUSES = [
  {
    id: "wh-1",
    name: "Mumbai Hub",
    lat: 19.076,
    lng: 72.8777,
    city: "Mumbai",
    state: "Maharashtra",
    isOperational: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "wh-2",
    name: "Delhi Hub",
    lat: 28.7041,
    lng: 77.1025,
    city: "Delhi",
    state: "Delhi",
    isOperational: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_SELLER = {
  id: "seller-1",
  name: "Best Goods Pvt Ltd",
  phone: "9800000001",
  email: "best@goods.in",
  lat: 19.1,  // near Mumbai
  lng: 72.9,
  city: "Mumbai",
  state: "Maharashtra",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_CUSTOMER = {
  id: "cust-1",
  name: "Shree Kirana Store",
  phone: "9847000001",
  email: "shree@kirana.in",
  lat: 19.25,  // ~20 km from Mumbai Hub
  lng: 73.0,
  addressLine: "Shop 12, MG Road",
  city: "Thane",
  state: "Maharashtra",
  pincode: "400001",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_FAR_CUSTOMER = {
  id: "cust-2",
  name: "North Star Store",
  phone: "9847000002",
  email: "north@star.in",
  lat: 28.6,  // Delhi area — ~1,150 km from Mumbai
  lng: 77.2,
  addressLine: "Block A, Connaught Place",
  city: "Delhi",
  state: "Delhi",
  pincode: "110001",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_PRODUCT = {
  id: "prod-1",
  name: "Rice 25kg Bag",
  weightKg: 25,
  sellerId: "seller-1",
  category: "Grocery",
  priceINR: 1200,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_SHIPPING_RATES = [
  {
    id: "rate-1",
    transportMode: "MINI_VAN",
    minDistanceKm: 0,
    maxDistanceKm: 100,
    ratePerKmPerKg: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rate-2",
    transportMode: "TRUCK",
    minDistanceKm: 100,
    maxDistanceKm: 500,
    ratePerKmPerKg: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rate-3",
    transportMode: "AEROPLANE",
    minDistanceKm: 500,
    maxDistanceKm: null,
    ratePerKmPerKg: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_SPEED_STANDARD = {
  id: "speed-1",
  speed: "STANDARD",
  baseCourierChargeINR: 10,
  extraChargePerKg: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_SPEED_EXPRESS = {
  id: "speed-2",
  speed: "EXPRESS",
  baseCourierChargeINR: 10,
  extraChargePerKg: 1.2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Test Suite ─────────────────────────────────────────

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════
//  Health Check
// ═══════════════════════════════════════════════════════

describe("GET /health", () => {
  it("should return 200 with status ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data).toHaveProperty("timestamp");
    expect(body.data).toHaveProperty("uptime");
  });
});

// ═══════════════════════════════════════════════════════
//  GET /api/v1/warehouse/nearest
// ═══════════════════════════════════════════════════════

describe("GET /api/v1/warehouse/nearest", () => {
  function setupSellerAndWarehouses() {
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(MOCK_SELLER);
    vi.mocked(prisma.warehouse.findMany).mockResolvedValue(MOCK_WAREHOUSES);
  }

  it("should return nearest warehouse for a valid seller", async () => {
    setupSellerAndWarehouses();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/warehouse/nearest",
      query: { sellerId: "seller-1" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("warehouseId");
    expect(body.data).toHaveProperty("warehouseName");
    expect(body.data).toHaveProperty("warehouseLocation");
    expect(body.data.warehouseLocation).toHaveProperty("lat");
    expect(body.data.warehouseLocation).toHaveProperty("lng");
    expect(body.data).toHaveProperty("distanceFromSellerKm");
    expect(typeof body.data.distanceFromSellerKm).toBe("number");

    // Seller is near Mumbai (19.1, 72.9) → nearest should be Mumbai Hub
    expect(body.data.warehouseId).toBe("wh-1");
    expect(body.data.warehouseName).toBe("Mumbai Hub");
  });

  it("should return 400 if sellerId is missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/warehouse/nearest",
      query: {},
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 if seller does not exist", async () => {
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(null);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/warehouse/nearest",
      query: { sellerId: "nonexistent" },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("should return 422 if no operational warehouses exist", async () => {
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(MOCK_SELLER);
    vi.mocked(prisma.warehouse.findMany).mockResolvedValue([]);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/warehouse/nearest",
      query: { sellerId: "seller-1" },
    });

    expect(res.statusCode).toBe(422);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BUSINESS_RULE_VIOLATION");
  });
});

// ═══════════════════════════════════════════════════════
//  GET /api/v1/shipping-charge
// ═══════════════════════════════════════════════════════

describe("GET /api/v1/shipping-charge", () => {
  function setupShortDistanceShipping() {
    // Warehouse: Mumbai Hub, Customer: Thane → ~22 km (MiniVan territory)
    vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(MOCK_WAREHOUSES[0]);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(MOCK_CUSTOMER);
    vi.mocked(prisma.shippingRate.findMany).mockResolvedValue(MOCK_SHIPPING_RATES);
    vi.mocked(prisma.deliverySpeedConfig.findUnique).mockResolvedValue(MOCK_SPEED_STANDARD);
  }

  it("should calculate shipping charge for short distance (STANDARD)", async () => {
    setupShortDistanceShipping();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/shipping-charge",
      query: {
        warehouseId: "wh-1",
        customerId: "cust-1",
        deliverySpeed: "standard",
        weightKg: "2",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("shippingCharge");
    expect(body.data).toHaveProperty("breakdown");
    expect(typeof body.data.shippingCharge).toBe("number");
    expect(body.data.shippingCharge).toBeGreaterThan(0);

    const bk = body.data.breakdown;
    expect(bk.transportMode).toBe("MINI_VAN");
    expect(bk.deliverySpeed).toBe("STANDARD");
    expect(bk.baseCourierCharge).toBe(10);
    expect(bk.expressExtraCharge).toBe(0); // Standard has no extra
    expect(bk.totalWeight).toBe(2);
    expect(bk.distanceKm).toBeGreaterThan(0);
    expect(bk.distanceKm).toBeLessThan(100); // should be ~22 km

    // transportCost = distance * weight * rate = ~22 * 2 * 3 = ~132
    // shippingCharge = baseCourier(10) + express(0) + transport(~132) = ~142
    expect(bk.transportCost).toBeGreaterThan(100);
    expect(bk.transportCost).toBeLessThan(200);
  });

  it("should calculate shipping charge with EXPRESS speed", async () => {
    vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(MOCK_WAREHOUSES[0]);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(MOCK_CUSTOMER);
    vi.mocked(prisma.shippingRate.findMany).mockResolvedValue(MOCK_SHIPPING_RATES);
    vi.mocked(prisma.deliverySpeedConfig.findUnique).mockResolvedValue(MOCK_SPEED_EXPRESS);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/shipping-charge",
      query: {
        warehouseId: "wh-1",
        customerId: "cust-1",
        deliverySpeed: "EXPRESS",
        weightKg: "5",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);

    const bk = body.data.breakdown;
    expect(bk.deliverySpeed).toBe("EXPRESS");
    expect(bk.baseCourierCharge).toBe(10);
    // Express extra = 1.2 * 5 = 6
    expect(bk.expressExtraCharge).toBe(6);
    expect(bk.totalWeight).toBe(5);
  });

  it("should use default weight of 1 kg if weightKg is omitted", async () => {
    setupShortDistanceShipping();

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/shipping-charge",
      query: {
        warehouseId: "wh-1",
        customerId: "cust-1",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.breakdown.totalWeight).toBe(1);
  });

  it("should select AEROPLANE for long distance (>500 km)", async () => {
    vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(MOCK_WAREHOUSES[0]); // Mumbai
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(MOCK_FAR_CUSTOMER); // Delhi ~1150 km
    vi.mocked(prisma.shippingRate.findMany).mockResolvedValue(MOCK_SHIPPING_RATES);
    vi.mocked(prisma.deliverySpeedConfig.findUnique).mockResolvedValue(MOCK_SPEED_STANDARD);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/shipping-charge",
      query: {
        warehouseId: "wh-1",
        customerId: "cust-2",
        weightKg: "1",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.breakdown.transportMode).toBe("AEROPLANE");
    expect(body.data.breakdown.distanceKm).toBeGreaterThan(500);
  });

  it("should return 400 for missing warehouseId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/shipping-charge",
      query: { customerId: "cust-1" },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for missing customerId", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/shipping-charge",
      query: { warehouseId: "wh-1" },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 if warehouse does not exist", async () => {
    vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(MOCK_CUSTOMER);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/shipping-charge",
      query: { warehouseId: "nonexistent", customerId: "cust-1" },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("should return 404 if customer does not exist", async () => {
    vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(MOCK_WAREHOUSES[0]);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/shipping-charge",
      query: { warehouseId: "wh-1", customerId: "nonexistent" },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

// ═══════════════════════════════════════════════════════
//  POST /api/v1/shipping-charge/calculate
// ═══════════════════════════════════════════════════════

describe("POST /api/v1/shipping-charge/calculate", () => {
  function setupFullCalculation() {
    // Seller → nearest warehouse → customer
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(MOCK_SELLER);
    vi.mocked(prisma.warehouse.findMany).mockResolvedValue(MOCK_WAREHOUSES);
    vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(MOCK_WAREHOUSES[0]);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(MOCK_CUSTOMER);
    vi.mocked(prisma.product.findFirst).mockResolvedValue(MOCK_PRODUCT);
    vi.mocked(prisma.shippingRate.findMany).mockResolvedValue(MOCK_SHIPPING_RATES);
    vi.mocked(prisma.deliverySpeedConfig.findUnique).mockResolvedValue(MOCK_SPEED_STANDARD);
  }

  it("should calculate end-to-end shipping with product", async () => {
    setupFullCalculation();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/shipping-charge/calculate",
      payload: {
        sellerId: "seller-1",
        customerId: "cust-1",
        deliverySpeed: "standard",
        productId: "prod-1",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("shippingCharge");
    expect(body.data).toHaveProperty("nearestWarehouse");
    expect(body.data).toHaveProperty("breakdown");

    // Verify nearest warehouse info
    expect(body.data.nearestWarehouse.warehouseId).toBe("wh-1");
    expect(body.data.nearestWarehouse.warehouseName).toBe("Mumbai Hub");

    // Verify breakdown
    const bk = body.data.breakdown;
    expect(bk.transportMode).toBe("MINI_VAN");
    expect(bk.totalWeight).toBe(25); // MOCK_PRODUCT weight
    expect(bk.deliverySpeed).toBe("STANDARD");
    expect(bk.baseCourierCharge).toBe(10);
    expect(bk.expressExtraCharge).toBe(0);

    // Transport cost = ~22km * 25kg * 3 ₹/km/kg ≈ 1650
    expect(bk.transportCost).toBeGreaterThan(1000);
    expect(bk.transportCost).toBeLessThan(2500);

    // Total = baseCourier(10) + express(0) + transport(~1650) ≈ 1660
    expect(body.data.shippingCharge).toBeGreaterThan(1000);
  });

  it("should calculate shipping without productId (default 1 kg)", async () => {
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(MOCK_SELLER);
    vi.mocked(prisma.warehouse.findMany).mockResolvedValue(MOCK_WAREHOUSES);
    vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(MOCK_WAREHOUSES[0]);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(MOCK_CUSTOMER);
    vi.mocked(prisma.shippingRate.findMany).mockResolvedValue(MOCK_SHIPPING_RATES);
    vi.mocked(prisma.deliverySpeedConfig.findUnique).mockResolvedValue(MOCK_SPEED_STANDARD);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/shipping-charge/calculate",
      payload: {
        sellerId: "seller-1",
        customerId: "cust-1",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.breakdown.totalWeight).toBe(1);
  });

  it("should handle EXPRESS delivery speed with correct surcharge", async () => {
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(MOCK_SELLER);
    vi.mocked(prisma.warehouse.findMany).mockResolvedValue(MOCK_WAREHOUSES);
    vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(MOCK_WAREHOUSES[0]);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(MOCK_CUSTOMER);
    vi.mocked(prisma.product.findFirst).mockResolvedValue(MOCK_PRODUCT);
    vi.mocked(prisma.shippingRate.findMany).mockResolvedValue(MOCK_SHIPPING_RATES);
    vi.mocked(prisma.deliverySpeedConfig.findUnique).mockResolvedValue(MOCK_SPEED_EXPRESS);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/shipping-charge/calculate",
      payload: {
        sellerId: "seller-1",
        customerId: "cust-1",
        deliverySpeed: "express",
        productId: "prod-1",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    const bk = body.data.breakdown;
    expect(bk.deliverySpeed).toBe("EXPRESS");
    expect(bk.baseCourierCharge).toBe(10);
    // Express extra = 1.2 * 25 = 30
    expect(bk.expressExtraCharge).toBe(30);
  });

  it("should return 400 for missing sellerId", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/shipping-charge/calculate",
      payload: { customerId: "cust-1" },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for missing customerId", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/shipping-charge/calculate",
      payload: { sellerId: "seller-1" },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 if seller does not exist", async () => {
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(null);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/shipping-charge/calculate",
      payload: {
        sellerId: "nonexistent",
        customerId: "cust-1",
      },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("should return 404 if product does not belong to seller", async () => {
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(MOCK_SELLER);
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/shipping-charge/calculate",
      payload: {
        sellerId: "seller-1",
        customerId: "cust-1",
        productId: "wrong-product",
      },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("should return 422 if no warehouses are operational", async () => {
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(MOCK_SELLER);
    vi.mocked(prisma.warehouse.findMany).mockResolvedValue([]);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/shipping-charge/calculate",
      payload: {
        sellerId: "seller-1",
        customerId: "cust-1",
      },
    });

    expect(res.statusCode).toBe(422);
    const body = res.json();
    expect(body.error.code).toBe("BUSINESS_RULE_VIOLATION");
  });
});

// ═══════════════════════════════════════════════════════
//  Edge Cases & Response Envelope
// ═══════════════════════════════════════════════════════

describe("Response Envelope Contract", () => {
  it("success responses should always have { success: true, data: {...} }", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    const body = res.json();

    expect(body).toHaveProperty("success", true);
    expect(body).toHaveProperty("data");
    expect(body).not.toHaveProperty("error");
  });

  it("error responses should always have { success: false, error: { code, message } }", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/warehouse/nearest",
      query: {},
    });

    const body = res.json();
    expect(body).toHaveProperty("success", false);
    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
    expect(body).not.toHaveProperty("data");
  });
});

describe("Unknown routes", () => {
  it("should return 404 for undefined endpoints", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/nonexistent",
    });

    expect(res.statusCode).toBe(404);
  });
});
