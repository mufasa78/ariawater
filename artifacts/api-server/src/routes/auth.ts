import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  GetMeResponse,
} from "@workspace/api-zod";

const router: Router = Router();

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json(GetMeResponse.parse({ 
    id: req.user!.userId, 
    name: req.user!.name, 
    email: req.user!.email, 
    phone: null, 
    role: req.user!.role 
  }));
});

// POST /api/auth/logout - Clerk handles logout on the frontend
// This endpoint is kept for compatibility but does nothing since we're using Clerk
router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Use Clerk signOut() on the frontend" });
});

export default router;
