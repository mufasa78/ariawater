import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import ordersRouter from "./orders";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/dashboard", dashboardRouter);
router.use("/payments", paymentsRouter);
router.use("/uploads", uploadsRouter);

export default router;
