import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { convex, api } from "../lib/convex-client.js";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    // Test Convex connectivity with a quick query
    await Promise.race([
      convex.query(api.products.list, {}) as Promise<unknown[]>,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Convex health check timeout")), 5000)
      ),
    ]);
    
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "degraded", error: "Database connection failed" });
  }
});

export default router;
