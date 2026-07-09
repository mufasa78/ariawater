import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  InitializePaymentBody,
  VerifyPaymentBody,
  InitializePaymentResponse,
  VerifyPaymentResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Paystack integration — uses PAYSTACK_SECRET_KEY env var if available
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";

router.post("/payments/initialize", requireAuth, async (req, res): Promise<void> => {
  const parsed = InitializePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const isAdmin = req.session.userRole === "admin";
  const orderConditions = [eq(ordersTable.id, parsed.data.orderId)];
  if (!isAdmin) {
    orderConditions.push(eq(ordersTable.customerId, req.session.userId!));
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(...orderConditions));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // If no Paystack key configured, return a mock response (development mode)
  if (!PAYSTACK_SECRET) {
    const mockRef = `mock_${Date.now()}_${order.id}`;
    await db
      .update(ordersTable)
      .set({ paystackRef: mockRef })
      .where(eq(ordersTable.id, order.id));

    res.json(
      InitializePaymentResponse.parse({
        authorizationUrl: `https://checkout.paystack.com/mock_${mockRef}`,
        reference: mockRef,
      })
    );
    return;
  }

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(Number(order.totalKes) * 100), // Paystack uses kobo/cents
        currency: "KES",
        reference: `ari-${order.id}-${Date.now()}`,
        callback_url: `${process.env.APP_URL ?? ""}/orders/${order.id}`,
      }),
    });

    const data = (await response.json()) as {
      status: boolean;
      data?: { authorization_url: string; reference: string };
      message?: string;
    };

    if (!data.status || !data.data) {
      logger.error({ data }, "Paystack initialization failed");
      res.status(502).json({ error: "Payment initialization failed" });
      return;
    }

    await db
      .update(ordersTable)
      .set({ paystackRef: data.data.reference })
      .where(eq(ordersTable.id, order.id));

    res.json(
      InitializePaymentResponse.parse({
        authorizationUrl: data.data.authorization_url,
        reference: data.data.reference,
      })
    );
  } catch (err) {
    logger.error({ err }, "Paystack request error");
    res.status(502).json({ error: "Payment service unavailable" });
  }
});

router.post("/payments/verify", requireAuth, async (req, res): Promise<void> => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { reference } = parsed.data;

  // Mock verification for development
  if (!PAYSTACK_SECRET || reference.startsWith("mock_")) {
    const verifyIsAdmin = req.session.userRole === "admin";
    const verifyConditions = [eq(ordersTable.paystackRef, reference)];
    if (!verifyIsAdmin) {
      verifyConditions.push(eq(ordersTable.customerId, req.session.userId!));
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(...verifyConditions));

    if (order) {
      await db
        .update(ordersTable)
        .set({ paymentStatus: "completed" })
        .where(eq(ordersTable.id, order.id));
    }

    res.json(
      VerifyPaymentResponse.parse({
        success: true,
        status: "success",
        orderId: order?.id ?? null,
      })
    );
    return;
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const data = (await response.json()) as {
      status: boolean;
      data?: { status: string; reference: string };
    };

    if (!data.status || !data.data) {
      res.json(VerifyPaymentResponse.parse({ success: false, status: "failed", orderId: null }));
      return;
    }

    const payStatus = data.data.status === "success" ? "completed" : "failed";

    const liveIsAdmin = req.session.userRole === "admin";
    const liveConditions = [eq(ordersTable.paystackRef, reference)];
    if (!liveIsAdmin) {
      liveConditions.push(eq(ordersTable.customerId, req.session.userId!));
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(and(...liveConditions));

    if (order) {
      await db
        .update(ordersTable)
        .set({ paymentStatus: payStatus })
        .where(eq(ordersTable.id, order.id));
    }

    res.json(
      VerifyPaymentResponse.parse({
        success: payStatus === "completed",
        status: data.data.status,
        orderId: order?.id ?? null,
      })
    );
  } catch (err) {
    logger.error({ err }, "Paystack verify error");
    res.status(502).json({ error: "Payment service unavailable" });
  }
});

export default router;
