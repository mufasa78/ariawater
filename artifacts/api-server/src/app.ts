import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set.");
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use("/api", router);

export default app;
