import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import magicAuthRouter from "./magic-auth.js";
import productsRouter from "./products.js";
import ordersRouter from "./orders.js";
import dashboardRouter from "./dashboard.js";
import paymentsRouter from "./payments.js";
import uploadsRouter from "./uploads.js";
import ticketsRouter from "./tickets.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/magic-auth", magicAuthRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/dashboard", dashboardRouter);
router.use("/payments", paymentsRouter);
router.use("/uploads", uploadsRouter);
router.use("/tickets", ticketsRouter);

export default router;
