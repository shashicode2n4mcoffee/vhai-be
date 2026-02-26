/**
 * Express App — Configures middleware and routes.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestIdMiddleware } from "./middleware/auditLog.js";
import { requestLoggerMiddleware } from "./middleware/requestLogger.js";
import { requestTimeoutMiddleware } from "./middleware/requestTimeout.js";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index.js";
import { openApiSpec } from "./openapi.js";

const app = express();

// ── Security Middleware ──────────────────────────────────
app.use(helmet());
const allowedOrigins = env.FRONTEND_URL.split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 1 ? allowedOrigins : allowedOrigins[0] ?? env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Body & Cookies ───────────────────────────────────────
// Larger limits only for routes that need them (order matters: specific before default)
app.use("/api/interviews", express.json({ limit: "10mb" }), express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/errors", express.json({ limit: "2mb" }), express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// ── Request ID & Logging ─────────────────────────────────
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// ── Rate Limiting ────────────────────────────────────────
app.use("/api", generalLimiter);

// ── Health Check (no timeout) ────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

/** Readiness: DB ping. Returns 503 if DB unreachable. */
app.get("/api/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

/** Public config (no auth) — used by Settings About. */
app.get("/api/config/public", (_req, res) => {
  res.json({
    geminiModel: env.GEMINI_MODEL,
    geminiReportModel: env.GEMINI_REPORT_MODEL,
  });
});

if (env.NODE_ENV === "development") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

// ── API Routes (with timeout) ─────────────────────────────
app.use("/api", requestTimeoutMiddleware, routes);

// ── Error Handling ───────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
