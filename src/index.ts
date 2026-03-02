/**
 * Server Entry Point
 * Starts the Fastify server with graceful shutdown handling.
 */
import { buildApp } from "./app.js";
import { env } from "./config/index.js";
import { DatabaseClient } from "./infrastructure/database/index.js";
import { CacheClient } from "./infrastructure/cache/index.js";

async function main(): Promise<void> {
  const app = await buildApp();

  // ─── Graceful Shutdown ───────────────────────────────

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully…`);

      await app.close();
      await DatabaseClient.disconnect();
      await CacheClient.disconnect();

      app.log.info("Server shut down cleanly");
      process.exit(0);
    });
  }

  // ─── Connect to dependencies ─────────────────────────

  try {
    // Ensure DB connection is healthy
    const db = DatabaseClient.getInstance();
    await db.$connect();
    app.log.info("✅ Database connected");

    // Connect Redis (lazy-connect mode)
    try {
      const redis = CacheClient.getInstance().getRawClient();
      await redis.connect();
      app.log.info("✅ Redis connected");
    } catch {
      app.log.warn("⚠️  Redis unavailable – running without cache");
    }
  } catch (err) {
    app.log.fatal(err, "Failed to connect to dependencies");
    process.exit(1);
  }

  // ─── Start Server ────────────────────────────────────

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(
      `🚀 Server running at http://${env.HOST}:${env.PORT}`,
    );
    app.log.info(
      `📚 API docs at http://${env.HOST}:${env.PORT}/docs`,
    );
  } catch (err) {
    app.log.fatal(err, "Failed to start server");
    process.exit(1);
  }
}

main();
