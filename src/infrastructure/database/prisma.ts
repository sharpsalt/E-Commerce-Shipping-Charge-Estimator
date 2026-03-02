/**
 * Prisma Client — Singleton Pattern
 *
 * Ensures exactly one PrismaClient instance exists across the entire
 * application lifecycle.  This prevents connection-pool exhaustion
 * during hot-reloads (dev) and guarantees a single pool in production.
 *
 * Usage:
 *   const db = DatabaseClient.getInstance();
 *   const customer = await db.customer.findUnique(...);
 */
import { PrismaClient } from "@prisma/client";
import { env } from "../../config/index.js";

export class DatabaseClient {
  private static instance: PrismaClient | null = null;

  /** Prevent direct construction — use getInstance() */
  private constructor() {}

  /**
   * Returns the singleton PrismaClient.
   * Lazily creates it on first call.
   */
  static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log:
          env.NODE_ENV === "development"
            ? ["query", "warn", "error"]
            : ["error"],
      });
    }
    return DatabaseClient.instance;
  }

  /** Disconnect and release the singleton (for graceful shutdown). */
  static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      DatabaseClient.instance = null;
    }
  }
}

/**
 * Convenience export — most files just need the client directly.
 * This is still a singleton; it's the same instance every time.
 */
export const prisma = DatabaseClient.getInstance();
