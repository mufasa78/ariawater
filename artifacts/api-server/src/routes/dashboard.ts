import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { requireAdmin } from "../middlewares/auth.js";
import {
  GetDashboardSummaryResponse,
  GetRecentOrdersResponse,
  GetRevenueTrendResponse,
} from "@workspace/api-zod";

const router: Router = Router();

// GET /api/dashboard/summary
router.get("/summary", requireAdmin, async (_req, res) => {
  const summary = await convex.query(api.dashboard.summary, { now: Date.now() }) as Record<string, unknown>;
  res.json(GetDashboardSummaryResponse.parse(summary));
});

// GET /api/dashboard/recent-orders
router.get("/recent-orders", requireAdmin, async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const orders = await convex.query(api.dashboard.recentOrders, { limit }) as unknown[];
  res.json(GetRecentOrdersResponse.parse(orders));
});

// GET /api/dashboard/revenue-trend
router.get("/revenue-trend", requireAdmin, async (req, res) => {
  const days = req.query.days ? Number(req.query.days) : 30;
  const trend = await convex.query(api.dashboard.revenueTrend, { days, now: Date.now() }) as unknown[];
  res.json(GetRevenueTrendResponse.parse(trend));
});

export default router;
