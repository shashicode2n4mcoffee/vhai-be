/**
 * Express App — Configures middleware and routes.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestIdMiddleware } from "./middleware/auditLog.js";
import routes from "./routes/index.js";

const app = express();

// ── Security Middleware ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Request ID ───────────────────────────────────────────
app.use(requestIdMiddleware);

// ── Rate Limiting ────────────────────────────────────────
app.use("/api", generalLimiter);

// ── Health Check ─────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ── API Routes ───────────────────────────────────────────
app.use("/api", routes);

// ── Error Handling ───────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
