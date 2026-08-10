import { Router } from "express";
import { optionalAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

// Public test endpoint - no auth required
router.get("/public", (req, res) => {
  res.json({ 
    message: "Public debug route works",
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV
  });
});

// Environment variables check - shows which are set (NOT their values)
router.get("/env", (req, res) => {
  const envStatus = {
    CONVEX_URL: !!process.env.CONVEX_URL,
    CONVEX_DEPLOYMENT_URL: !!process.env.CONVEX_DEPLOYMENT_URL,
    CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY: !!process.env.CLERK_PUBLISHABLE_KEY,
    LIPANA_SECRET_KEY: !!process.env.LIPANA_SECRET_KEY,
    LIPANA_PUBLISHABLE_KEY: !!process.env.LIPANA_PUBLISHABLE_KEY,
    ALLOWED_ORIGINS: !!process.env.ALLOWED_ORIGINS,
    NODE_ENV: process.env.NODE_ENV || "unknown",
    // Show actual Convex URL (safe to show, it's public)
    convexUrl: process.env.CONVEX_URL || process.env.CONVEX_DEPLOYMENT_URL || "NOT SET - THIS IS THE PROBLEM!",
  };

  const criticalMissing = Object.entries(envStatus)
    .filter(([key, value]) => !value && key !== "NODE_ENV" && key !== "convexUrl")
    .map(([key]) => key);

  res.json({
    message: "Environment variable status (true = set, false = not set)",
    environment: envStatus,
    critical_missing: criticalMissing,
    action_required: criticalMissing.length > 0 
      ? `Set these in Vercel: ${criticalMissing.join(", ")}`
      : "All critical variables are set!",
  });
});

// Comprehensive health check
router.get("/health-detailed", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    checks: {
      convexConfigured: !!(process.env.CONVEX_URL || process.env.CONVEX_DEPLOYMENT_URL),
      clerkConfigured: !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY),
      paymentConfigured: !!(process.env.LIPANA_SECRET_KEY && process.env.LIPANA_PUBLISHABLE_KEY),
    },
  };

  // If critical services not configured, mark as degraded
  if (!health.checks.convexConfigured) {
    health.status = "error - CONVEX_URL not set";
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

// Authenticated test endpoint - shows your auth status
router.get("/auth", optionalAuth, (req, res) => {
  res.json({ 
    message: "Auth debug route works",
    authenticated: !!req.auth?.userId,
    hasUser: !!req.user,
    user: req.user ? {
      userId: req.user.userId,
      role: req.user.role,
      approved: req.user.approved,
      email: req.user.email
    } : null,
    timestamp: new Date().toISOString()
  });
});

// Admin test endpoint - requires admin role
router.get("/admin", requireAdmin, (req, res) => {
  res.json({ 
    message: "Admin debug route works! You have admin access.",
    user: {
      userId: req.user!.userId,
      role: req.user!.role,
      email: req.user!.email
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
