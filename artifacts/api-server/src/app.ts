import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY must be set.");
}

const convexUrl = process.env.CONVEX_URL ?? process.env.CONVEX_DEPLOYMENT_URL;
if (!convexUrl) {
  throw new Error("CONVEX_URL or CONVEX_DEPLOYMENT_URL must be set.");
}

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res: any) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Lock CORS to same-origin in production; allow dev origins locally
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(cookieParser());

// Capture raw body for webhook signature verification BEFORE JSON parsing
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware
const clerkPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY ??
  process.env.VITE_CLERK_PUBLISHABLE_KEY ??
  process.env.VITE_CLERK_PUBLIC_KEY;

if (!clerkPublishableKey) {
  throw new Error("CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY must be set.");
}

app.use(
  clerkMiddleware({
    publishableKey: clerkPublishableKey,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
);

// ── Security headers ─────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Allow same-origin framing only (protects admin/account pages)
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  // Modern referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Minimal permissions policy
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), payment=(self), geolocation=(self), usb=()",
  );
  // HSTS — only over TLS in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  // Cross-Origin Resource Policy — API responses are only readable by our origin
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
});

// Mount routes directly to support both with and without /api prefix
app.use("/", router);
// Replit preserves the artifact's `/api` service path when proxying requests.
// Keep the prefix here so `/api/products`, `/api/orders`, and `/api/healthz`
// reach the same route handlers in both preview and production.
app.use("/api", router);

// ── Global error handler — must be last, must have 4 args ────────────────────
// Catches unhandled errors (e.g. Convex Server Errors) and returns JSON instead
// of Express's default HTML page.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status =
    typeof err === "object" && err !== null && "status" in err && typeof (err as any).status === "number"
      ? (err as any).status
      : 500;
  const message =
    err instanceof Error ? err.message : "Internal server error";

  logger.error({ err }, "Unhandled error");

  res.status(status).json({ error: message });
});

export default app;
