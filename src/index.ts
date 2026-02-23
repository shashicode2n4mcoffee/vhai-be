/**
 * Server Entry Point — Starts the Express server.
 */

import "dotenv/config";

import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/database.js";

async function main() {
  // Test database connection
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Failed to connect to database", { error });
    process.exit(1);
  }

  // Start server
  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
    logger.info(`API Base: http://localhost:${env.PORT}/api`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down...");
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
