/**
 * Environment Configuration
 * Centralised, validated env access using Zod.
 * Fail-fast on missing / invalid env vars at startup.
 */
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_DB: z.coerce.number().int().min(0).default(0),

  // Cache TTLs (seconds)
  CACHE_TTL_NEAREST_WAREHOUSE: z.coerce.number().int().positive().default(300),
  CACHE_TTL_SHIPPING_CHARGE: z.coerce.number().int().positive().default(60),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
}

/** Singleton env config */
export const env = loadEnv();
