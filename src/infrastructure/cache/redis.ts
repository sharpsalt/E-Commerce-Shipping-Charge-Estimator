/**
 * Redis Cache — Singleton Pattern
 *
 * Wraps ioredis with JSON serialisation, TTL support, and
 * graceful degradation (cache misses return null, Redis errors
 * are swallowed so the app keeps working without cache).
 *
 * Usage:
 *   const cached = await CacheClient.getInstance().get<MyType>("key");
 *   await CacheClient.getInstance().set("key", value, 60);
 */
import Redis from "ioredis";
import { env } from "../../config/index.js";

export class CacheClient {
  private static instance: CacheClient | null = null;
  private redis: Redis;

  /** Prevent direct construction — use getInstance() */
  private constructor() {
    this.redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    this.redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    this.redis.on("connect", () => {
      console.log("[Redis] Connected");
    });
  }

  /** Returns the singleton CacheClient. */
  static getInstance(): CacheClient {
    if (!CacheClient.instance) {
      CacheClient.instance = new CacheClient();
    }
    return CacheClient.instance;
  }

  /** Expose the raw ioredis client (e.g. for connect() at startup). */
  getRawClient(): Redis {
    return this.redis;
  }

  /** Read a JSON value from cache. Returns null on miss or error. */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /** Write a JSON value to cache with a TTL in seconds. */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Silently degrade
    }
  }

  /** Delete all keys matching a glob pattern. */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch {
      // Silently degrade
    }
  }

  /** Disconnect and release the singleton (for graceful shutdown). */
  static async disconnect(): Promise<void> {
    if (CacheClient.instance) {
      await CacheClient.instance.redis.quit();
      CacheClient.instance = null;
    }
  }
}

// ─── Convenience free-functions (backward-compatible) ──

const cache = () => CacheClient.getInstance();

export function getRedisClient(): Redis {
  return cache().getRawClient();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  return cache().get<T>(key);
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  return cache().set(key, value, ttlSeconds);
}

export async function cacheDelete(pattern: string): Promise<void> {
  return cache().deletePattern(pattern);
}

/**
 * Cache-aside pattern: try cache → on miss run fetcher → cache result.
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const result = await fetcher();
  await cacheSet(key, result, ttlSeconds);
  return result;
}

export async function disconnectRedis(): Promise<void> {
  return CacheClient.disconnect();
}
