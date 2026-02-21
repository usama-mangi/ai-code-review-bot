import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { checkDbConnection } from "./db/index.js";
import { webhookRouter } from "./routes/webhook.route.js";
import { reviewsRouter } from "./routes/reviews.route.js";
import { authRouter } from "./routes/auth.js";
import { requireAuth } from "./auth.middleware.js";
import { startWorker } from "./queue/worker.js";
import cookieParser from "cookie-parser";

const app = express();

// Trust the Nginx reverse proxy to correctly pass the client IP in X-Forwarded-For
app.set("trust proxy", 1);

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Body Parsing ─────────────────────────────────────────────────────────────

// Capture raw body for webhook signature verification
app.use(
  "/api/webhook",
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString("utf-8");
    },
  })
);

app.use("/api", express.json());
app.use("/api", cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/webhook", webhookLimiter, webhookRouter);

// Auth Routes (Open to public for auth, unprotected)
app.use("/api/auth", apiLimiter, authRouter);
// Protect the 'me' route natively here instead of inside the router for better visibility
authRouter.get("/me", requireAuth, async (req, res) => {
  res.json(req.user);
});

// Protect reviews with authentication
app.use("/api/reviews", apiLimiter, requireAuth, reviewsRouter);

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error("Unhandled error", { error: err });
    res.status(500).json({ error: "Internal server error" });
  }
);

// ─── Startup ──────────────────────────────────────────────────────────────────

async function main() {
  try {
    await checkDbConnection();
    startWorker();

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📡 Webhook endpoint: http://localhost:${env.PORT}/api/webhook`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: err });
    process.exit(1);
  }
}

main();
