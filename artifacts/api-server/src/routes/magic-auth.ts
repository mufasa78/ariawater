import { Router } from "express";
import jwt from "jsonwebtoken";
import { convex, api } from "../lib/convex-client.js";
import type { Role } from "../middlewares/auth.js";

const router: Router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
    | "none"
    | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

function signToken(payload: {
  userId: string;
  role: Role;
  name: string;
  email: string;
  approved: boolean;
}) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

/**
 * POST /api/magic-auth/request
 * Request a magic link to be sent to email
 */
router.post("/request", async (req, res) => {
  const { email, name, phone } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  try {
    // Generate magic link token
    const result = await convex.mutation(api.magicLinks.generateMagicLink, {
      email,
      name: name || undefined,
      phone: phone || undefined,
    }) as { token: string; expiresAt: number; userId: string };

    // In production, you would send this via email service (SendGrid, AWS SES, etc.)
    // For now, we'll return it in the response for testing
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/verify?token=${result.token}`;

    // TODO: Send email with magic link
    // await sendMagicLinkEmail(email, magicLink);

    res.json({
      success: true,
      message: "Magic link sent to your email",
      // REMOVE THIS IN PRODUCTION - only for development/testing
      ...(process.env.NODE_ENV !== "production" && {
        magicLink,
        token: result.token,
        expiresAt: result.expiresAt,
      }),
    });
  } catch (error) {
    console.error("Magic link generation error:", error);
    res.status(500).json({
      error: "Failed to generate magic link",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/magic-auth/verify
 * Verify a magic link token and log the user in
 */
router.post("/verify", async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  try {
    // Verify the magic link token
    const result = await convex.mutation(api.magicLinks.verifyMagicLink, {
      token,
    }) as {
      userId: string;
      email: string;
      name: string;
      role: Role;
      phone?: string;
    };

    // Generate JWT token
    const jwtToken = signToken({
      userId: result.userId,
      role: result.role,
      name: result.name,
      email: result.email,
      approved: true, // Magic link users are auto-approved
    });

    // Set httpOnly cookie
    res.cookie("token", jwtToken, COOKIE_OPTIONS);

    // Return user data
    res.json({
      success: true,
      user: {
        id: result.userId,
        name: result.name,
        email: result.email,
        phone: result.phone || null,
        role: result.role,
      },
    });
  } catch (error) {
    console.error("Magic link verification error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Return appropriate status codes
    if (errorMessage.includes("expired")) {
      res.status(410).json({ error: "Magic link has expired" });
    } else if (errorMessage.includes("already been used")) {
      res.status(410).json({ error: "Magic link has already been used" });
    } else if (errorMessage.includes("Invalid")) {
      res.status(404).json({ error: "Invalid magic link" });
    } else {
      res.status(500).json({ error: "Failed to verify magic link" });
    }
  }
});

/**
 * GET /api/magic-auth/check/:token
 * Check if a magic link token is valid (without consuming it)
 */
router.get("/check/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const result = await convex.query(api.magicLinks.checkMagicLink, {
      token,
    }) as { valid: boolean; reason?: string; email?: string };

    res.json(result);
  } catch (error) {
    console.error("Magic link check error:", error);
    res.status(500).json({ error: "Failed to check magic link" });
  }
});

export default router;
