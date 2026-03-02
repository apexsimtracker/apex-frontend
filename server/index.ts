import "dotenv/config";
import express from "express";
import cors from "cors";
import { config, logConfig } from "./config";
import { handleDemo } from "./routes/demo";
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
} from "./middleware/requestLogger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import {
  loginLimiter,
  signupLimiter,
  changePasswordLimiter,
  deleteAccountLimiter,
  createDiscussionLimiter,
  createCommentLimiter,
  uploadLimiter,
} from "./middleware/rateLimiter";
import { startSessionCleanup } from "./lib/sessionCleanup";

export function createServer() {
  // Log validated config on startup
  logConfig();

  const app = express();

  // Trust proxy for correct IP detection behind load balancers
  if (config.isProduction) {
    app.set("trust proxy", 1);
  }

  // Request ID + logging (must be first)
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Core middleware with secure CORS config
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Start session cleanup job
  startSessionCleanup();

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes with rate limiting
  // POST /api/auth/login - 10 per 10 minutes per IP
  app.post("/api/auth/login", loginLimiter, (_req, res) => {
    res.status(501).json({ error: { message: "Not implemented" } });
  });

  // POST /api/auth/signup - 5 per hour per IP
  app.post("/api/auth/signup", signupLimiter, (_req, res) => {
    res.status(501).json({ error: { message: "Not implemented" } });
  });

  // POST /api/settings/change-password - 10 per hour per userId/IP
  app.post("/api/settings/change-password", changePasswordLimiter, (_req, res) => {
    res.status(501).json({ error: { message: "Not implemented" } });
  });

  // DELETE /api/settings/account - 5 per hour per userId
  app.delete("/api/settings/account", deleteAccountLimiter, (_req, res) => {
    res.status(501).json({ error: { message: "Not implemented" } });
  });

  // Community routes with rate limiting
  // POST /api/community/discussions - 10 per hour per userId
  app.post("/api/community/discussions", createDiscussionLimiter, (_req, res) => {
    res.status(501).json({ error: { message: "Not implemented" } });
  });

  // POST /api/community/discussions/:id/comments - 60 per hour per userId
  app.post("/api/community/discussions/:id/comments", createCommentLimiter, (_req, res) => {
    res.status(501).json({ error: { message: "Not implemented" } });
  });

  // Telemetry upload with rate limiting - 120 per hour per userId/IP
  app.post("/api/telemetry/upload", uploadLimiter, (_req, res) => {
    res.status(501).json({ error: { message: "Not implemented" } });
  });

  // 404 handler (after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
