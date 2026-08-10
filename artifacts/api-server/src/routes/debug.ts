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
