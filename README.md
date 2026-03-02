#  E-Commerce Shipping Charge Estimator

A production-grade **B2B e-commerce marketplace API** for calculating shipping charges for Kirana store deliveries. Built with TypeScript, Fastify, PostgreSQL, and Redis.

---

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Fastify** over Express | 2-3× faster JSON serialisation, built-in schema validation, native async |
| **Strategy Pattern** for transport modes | New modes (drones, ships) can be added without touching shipping logic |
| **Repository Pattern** | Decouples business logic from Prisma — easy to swap DB or mock in tests |
| **Cache-aside** with Redis | Responses cached with TTL; gracefully degrades if Redis is unavailable |
| **Zod validation** | Runtime schema validation with full TypeScript type inference |
| **Config-driven rates** | Shipping rates & delivery speeds stored in DB, not hard-coded |
| **Haversine formula** | Accurate great-circle distance for geo calculations |

---

##  Quick Start

### Prerequisites

- Node.js ≥ 18
- Docker & Docker Compose (for PostgreSQL + Redis)

### 1. Clone & Install

```bash
git clone https://github.com/sharpsalt/E-Commerce-Shipping-Charge-Estimator.git
cd E-Commerce_Shipping_Charge_Estimator
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000` with Swagger docs at `http://localhost:3000/docs`.

---

##  API Endpoints

### Health Check
```
GET /health
```

### 1. Get Nearest Warehouse for a Seller

```
GET /api/v1/warehouse/nearest?sellerId=<id>&productId=<id>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "warehouseId": "clx...",
    "warehouseName": "BLR_Warehouse",
    "warehouseLocation": { "lat": 12.99999, "lng": 77.5946 },
    "distanceFromSellerKm": 142.35
  }
}
```

### 2. Get Shipping Charge (Warehouse → Customer)

```
GET /api/v1/shipping-charge?warehouseId=<id>&customerId=<id>&deliverySpeed=standard&weightKg=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shippingCharge": 150.00,
    "breakdown": {
      "distanceKm": 845.23,
      "transportMode": "AEROPLANE",
      "transportCost": 130.00,
      "baseCourierCharge": 10.00,
      "expressExtraCharge": 0,
      "totalWeight": 10,
      "deliverySpeed": "STANDARD"
    }
  }
}
```

### 3. Calculate Shipping (Seller → Customer, end-to-end)

```
POST /api/v1/shipping-charge/calculate
Content-Type: application/json

{
  "sellerId": "<id>",
  "customerId": "<id>",
  "deliverySpeed": "express",
  "productId": "<id>"    // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shippingCharge": 180.00,
    "nearestWarehouse": {
      "warehouseId": "clx...",
      "warehouseName": "BLR_Warehouse",
      "warehouseLocation": { "lat": 12.99999, "lng": 77.5946 }
    },
    "breakdown": {
      "distanceKm": 845.23,
      "transportMode": "AEROPLANE",
      "transportCost": 158.00,
      "baseCourierCharge": 10.00,
      "expressExtraCharge": 12.00,
      "totalWeight": 10,
      "deliverySpeed": "EXPRESS"
    }
  }
}
```

---

##  Shipping Charge Formula

```
Total = Base Courier Charge + Express Extra + Transport Cost

Where:
  Transport Cost  = distance_km × weight_kg × rate_per_km_per_kg
  Express Extra   = extra_charge_per_kg × weight_kg  (0 for Standard)

Transport Mode Selection (by distance):
  Mini Van    →   0 – 100 km    @ ₹3/km/kg
  Truck       → 100 – 500 km    @ ₹2/km/kg
  Aeroplane   → 500+ km         @ ₹1/km/kg

Delivery Speeds:
  Standard → ₹10 base + ₹0/kg extra
  Express  → ₹10 base + ₹1.2/kg extra
```

---

##  Project Structure

```
src/
├── config/              # Environment config (Zod-validated)
├── common/
│   ├── errors/          # Custom error hierarchy (AppError, NotFoundError, etc.)
│   ├── middleware/       # Global error handler
│   ├── types/           # API response envelope types
│   └── utils/           # Haversine geo distance, math helpers
├── infrastructure/
│   ├── database/        # Prisma client singleton
│   └── cache/           # Redis client + cache-aside helper
├── modules/
│   ├── customer/        # Customer repository
│   ├── seller/          # Seller repository
│   ├── product/         # Product repository
│   ├── warehouse/       # Warehouse repository, service, routes
│   └── shipping/        # Shipping rate repo, transport strategy,
│                        # shipping service, routes, schemas
├── app.ts               # Fastify app builder (plugins, routes)
└── index.ts             # Server entry point (graceful shutdown)

prisma/
├── schema.prisma        # Database schema (6 models, 2 enums)
└── seed.ts              # Seed data (customers, sellers, products,
                         # warehouses, shipping rates, delivery speeds)

tests/
└── unit/                # 58 unit tests (vitest)
    ├── geo.test.ts
    ├── math.test.ts
    ├── errors.test.ts
    ├── api-response.test.ts
    ├── transport-strategy.test.ts
    └── shipping-schema.test.ts
```

---

##  Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

---

##  Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create & run migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage |

---

##  Environment Variables

See `.env.example` for all available configuration options:

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | Server port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `CACHE_TTL_NEAREST_WAREHOUSE` | 300 | Cache TTL for nearest warehouse (seconds) |
| `CACHE_TTL_SHIPPING_CHARGE` | 60 | Cache TTL for shipping charges (seconds) |

---

## Error Handling

All errors return a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Customer with identifier 'xyz' not found"
  }
}
```

| HTTP Code | Error Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request parameters |
| 404 | `NOT_FOUND` | Entity not found |
| 409 | `CONFLICT` | Duplicate resource |
| 422 | `BUSINESS_RULE_VIOLATION` | No transport mode for distance, etc. |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 503 | `SERVICE_UNAVAILABLE` | Dependency down |

---

## Scalability Considerations

- **Stateless API**: Horizontally scalable behind a load balancer
- **Connection pooling**: Prisma manages PG connection pool
- **Redis caching**: Reduces DB load for repeated queries
- **Rate limiting**: Protects against abuse (100 req/min default)
- **Graceful shutdown**: Cleans up DB/Redis connections on SIGINT/SIGTERM
- **Config-driven**: Business rules (rates, speeds) in DB, not code — change without redeploy
- **Strategy Pattern**: Add new transport modes without modifying existing shipping logic

