import express from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { apiRouter } from "./routes/index.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const configuredCorsOrigins = env.CORS_ORIGIN.split(",").map((value) => value.trim()).filter(Boolean);
// Capacitor Android uses https://localhost as its WebView origin with androidScheme=https.
// Keep the normal website origins configured through CORS_ORIGIN; only add this exact native origin.
const allowedCorsOrigins = new Set([...configuredCorsOrigins, "https://localhost"]);

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin(origin, callback) {
        // Requests without Origin (e.g. health checks/server-to-server) are not browser CORS requests.
        if (!origin || allowedCorsOrigins.has(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === "/api/health/live",
      },
    }),
  );
  // Uploaded images are private application data and require an authenticated session.
  app.use(
    "/uploads",
    authenticate,
    express.static(path.resolve(process.cwd(), "uploads"), {
      fallthrough: false,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
