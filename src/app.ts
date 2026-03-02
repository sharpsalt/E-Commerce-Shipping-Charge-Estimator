/**
 * Application Builder
 * Constructs and configures the Fastify instance with all plugins,
 * middleware, and route registrations.
 */
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/index.js";
import { globalErrorHandler } from "./common/middleware/index.js";
import { successResponse } from "./common/types/index.js";
import { warehouseRoutes } from "./modules/warehouse/index.js";
import { shippingRoutes } from "./modules/shipping/index.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty", options: { colorize: true } } }
        : {}),
    },
    requestTimeout: 30_000,
    bodyLimit: 1_048_576, // 1 MB
  });

  // ─── Plugins ─────────────────────────────────────────

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "E-Commerce Shipping Charge Estimator",
        description:
          "B2B marketplace API for calculating shipping charges for Kirana store deliveries",
        version: "1.0.0",
      },
      servers: [{ url: `http://${env.HOST}:${env.PORT}` }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  // ─── Global Error Handler ────────────────────────────

  app.setErrorHandler(globalErrorHandler);

  // ─── Health Check ────────────────────────────────────

  app.get("/health", async () => {
    return successResponse({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ─── API Routes ──────────────────────────────────────

  await app.register(warehouseRoutes, { prefix: "/api/v1/warehouse" });
  await app.register(shippingRoutes, { prefix: "/api/v1/shipping-charge" });

  return app;
}
