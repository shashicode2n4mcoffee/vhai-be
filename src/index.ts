/**
 * Server Entry Point — Starts the Express server.
 */

import "dotenv/config";

import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/database.js";

async function main() {
  // Start server immediately so Cloud Run sees the container listening (avoids startup timeout).
  // DB connection runs after listen; if it fails, /api/health/ready will report not ready.
  const server = app.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
    logger.info(`API: path /api, port ${env.PORT}`);
  });

  // Connect to database in background (do not block startup)
  prisma
    .$connect()
    .then(() => logger.info("Database connected successfully"))
    .catch((error) => logger.error("Failed to connect to database", { error }));

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down...");
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  logger.error("Fatal startup error", { error });
  process.exit(1);
});
