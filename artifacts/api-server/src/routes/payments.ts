import { Router } from "express";
import { convex, api } from "../lib/convex-client";
import { requireAuth } from "../middlewares/auth";
import {
  InitializePaymentBody,
  InitializePaymentResponse,
  VerifyPaymentBody,
  VerifyPaymentResponse,
} from "@workspace/api-zod";

const router: Router = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// POST /api/payments/initialize
router.post("/initialize", requireAuth, async (req, res) => {
  const parsed = InitializePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const isAdmin = req.user!.role === "admin";
  const order = await convex.query(api.orders.get, { id: parsed.data.orderId }) as Record<string, unknown> | null;
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (!isAdmin && order.customerId !== req.user!.userId) { res.status(403).json({ error: "Access denied" }); return; }

  if (!PAYSTACK_SECRET) {
    // Mock mode
    const mockRef = `ARI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await convex.mutation(api.orders.updatePayment, { id: parsed.data.orderId, paystackRef: mockRef, paymentStatus: "pending" });
    res.json(InitializePaymentResponse.parse({ authorizationUrl: `https://mock-paystack.test/pay/${mockRef}`, reference: mockRef }));
    return;
  }

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: req.user!.email,
      amount: Math.round((order.totalKes as number) * 100),
      reference: `ARI-${parsed.data.orderId}-${Date.now()}`,
      metadata: { orderId: parsed.data.orderId },
    }),
  });
  const data = await paystackRes.json() as { status: boolean; data?: { authorization_url: string; reference: string } };
  if (!data.status || !data.data) { res.status(502).json({ error: "Payment provider error" }); return; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await convex.mutation(api.orders.updatePayment, { id: parsed.data.orderId as any, paystackRef: data.data.reference, paymentStatus: "pending" });
  res.json(InitializePaymentResponse.parse({ authorizationUrl: data.data.authorization_url, reference: data.data.reference }));
});

// POST /api/payments/verify
router.post("/verify", requireAuth, async (req, res) => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { reference } = parsed.data;
  const isAdmin = req.user!.role === "admin";

  if (!PAYSTACK_SECRET) {
    const order = await convex.query(api.orders.getByPaystackRef, {
      reference,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customerId: isAdmin ? undefined : req.user!.userId as any,
    }) as Record<string, unknown> | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (order) await convex.mutation(api.orders.updatePayment, { id: order._id as any, paymentStatus: "completed" });
    res.json(VerifyPaymentResponse.parse({ success: true, status: "success", orderId: (order?._id as string) ?? null }));
    return;
  }

  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const data = await paystackRes.json() as { status: boolean; data?: { status: string } };
  if (!data.status || !data.data) {
    res.json(VerifyPaymentResponse.parse({ success: false, status: "failed", orderId: null }));
    return;
  }

  const payStatus = data.data.status === "success" ? "completed" : "failed";
  const order = await convex.query(api.orders.getByPaystackRef, {
    reference,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customerId: isAdmin ? undefined : req.user!.userId as any,
  }) as Record<string, unknown> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (order) await convex.mutation(api.orders.updatePayment, { id: order._id as any, paymentStatus: payStatus });

  res.json(VerifyPaymentResponse.parse({ success: data.data.status === "success", status: data.data.status, orderId: (order?._id as string) ?? null }));
});

export default router;
