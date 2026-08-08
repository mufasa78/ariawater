import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import {
  InitializePaymentBody,
  InitializePaymentResponse,
  VerifyPaymentBody,
  VerifyPaymentResponse,
} from "@workspace/api-zod";
import { getLipanaClient, LipanaClient } from "../lib/lipana-client.js";

const router: Router = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "paystack"; // lipana | paystack

const isConvexId = (value: string) => /^[a-z0-9]{32}$/.test(value);

// POST /api/payments/initialize - Support both authenticated and guest checkout
router.post("/initialize", optionalAuth, async (req, res) => {
  const parsed = InitializePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  if (!isConvexId(parsed.data.orderId)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const isAdmin = req.user?.role === "admin";
  let order: Record<string, unknown> | null;
  try {
    order = await convex.query(api.orders.get, { id: parsed.data.orderId as any }) as Record<string, unknown> | null;
  } catch (error) {
    req.log?.warn?.({ err: error }, "Unable to look up order for payment initialization");
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  
  // Only check ownership if user is authenticated (not guest) and the order belongs to a customer
  if (req.user && !isAdmin && order.customerId && order.customerId !== req.user.userId){ res.status(403).json({ error: "Access denied" }); return; }

  // Lipana M-Pesa Payment
  if (PAYMENT_PROVIDER === "lipana") {
    try {
      const lipana = getLipanaClient();
      const phoneNumber = order.phone as string;

      // Validate and format phone number
      if (!LipanaClient.isValidKenyanPhone(phoneNumber)) {
        req.log?.warn?.({ phone: phoneNumber }, "Invalid Kenyan phone number format");
        res.status(400).json({ error: "Invalid Kenyan phone number format" });
        return;
      }

      const formattedPhone = LipanaClient.formatPhoneNumber(phoneNumber);
      const reference = `ARI-${parsed.data.orderId}-${Date.now()}`;
      const orderTotal = Math.round(order.totalKes as number);

      req.log?.info?.({ orderId: parsed.data.orderId, phone: formattedPhone, amount: orderTotal }, "Initiating Lipana STK push");

      // Build webhook callback URL: use explicit env var, else derive from Replit domain
      const webhookUrl =
        process.env.LIPANA_WEBHOOK_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}/api/payments/webhook/lipana`
          : process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/api/payments/webhook/lipana`
            : process.env.REPLIT_DEV_DOMAIN
              ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/payments/webhook/lipana`
              : undefined);

      if (!webhookUrl) {
        req.log?.error?.("Webhook URL not configured");
        res.status(500).json({ error: "Webhook URL not configured" });
        return;
      }

      // Create payment record BEFORE initiating STK
      await convex.mutation(api.orders.updatePayment, {
        id: parsed.data.orderId as any,
        paystackRef: reference,
        paymentStatus: "pending",
      });

      req.log?.info?.({ orderId: parsed.data.orderId, reference }, "Payment record created as pending");

      const paymentResult = await lipana.initiatePayment({
        amount: orderTotal,
        phone_number: formattedPhone,
        account_reference: reference,
        transaction_desc: `Ari Water Order #${parsed.data.orderId}`,
        callback_url: webhookUrl,
      });

      if (!paymentResult.success || !paymentResult.data) {
        // Payment provider unreachable or rejected — order is already created with pending status.
        // Return a 200 with a degraded payload so the client can show a "pay later" UX
        // rather than treating this as a hard error.
        req.log?.warn?.({ orderId: parsed.data.orderId, message: paymentResult.message }, "Lipana STK initiation failed");
        res.json(InitializePaymentResponse.parse({
          authorizationUrl: "",
          reference: reference,
          amountKes: orderTotal,
          message: paymentResult.message || "M-Pesa prompt could not be sent at this time. You can complete payment from your orders page.",
        }));
        return;
      }

      // Update order with Lipana transaction ID
      await convex.mutation(api.orders.updatePayment, {
        id: parsed.data.orderId as any,
        paystackRef: paymentResult.data.checkout_request_id,
        paymentStatus: "pending",
      });

      req.log?.info?.({ orderId: parsed.data.orderId, checkoutRequestId: paymentResult.data.checkout_request_id }, "Lipana STK initiated successfully");

      res.json(InitializePaymentResponse.parse({
        authorizationUrl: `mpesa://stk-push/${paymentResult.data.checkout_request_id}`,
        reference: paymentResult.data.checkout_request_id,
        amountKes: orderTotal,
        message: paymentResult.data.customer_message,
      }));
      return;
    } catch (error) {
      req.log?.error?.({ err: error, orderId: parsed.data.orderId }, "Failed to initialize M-Pesa payment");
      res.status(500).json({ 
        error: "Failed to initialize M-Pesa payment",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
      return;
    }
  }

  // Paystack Payment (Fallback)
  if (!PAYSTACK_SECRET) {
    // Mock mode
    const mockRef = `ARI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await convex.mutation(api.orders.updatePayment, { id: parsed.data.orderId as any, paystackRef: mockRef, paymentStatus: "pending" });
    res.json(InitializePaymentResponse.parse({ authorizationUrl: `https://mock-paystack.test/pay/${mockRef}`, reference: mockRef }));
    return;
  }

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: req.user?.email || (order.customerEmail as string),
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

// POST /api/payments/verify - Support both authenticated and guest checkout
router.post("/verify", optionalAuth, async (req, res) => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { reference } = parsed.data;
  const isAdmin = req.user?.role === "admin";

  req.log?.info?.({ reference, isAdmin }, "Payment verification request");

  // Lipana M-Pesa Verification - READ FROM DB ONLY (source of truth)
  if (PAYMENT_PROVIDER === "lipana") {
    try {
      // Find order by reference - this is our source of truth
      const order = await convex.query(api.orders.getByPaystackRef, {
        reference,
        customerId: isAdmin ? undefined : (req.user?.userId as any),
      }) as Record<string, unknown> | null;

      if (!order) {
        req.log?.warn?.({ reference }, "Order not found for verification");
        res.json(VerifyPaymentResponse.parse({ 
          success: false, 
          status: "failed", 
          orderId: null,
          message: "Order not found" 
        }));
        return;
      }

      // Return the status from our database (webhook-updated)
      const paymentStatus = order.paymentStatus as string;
      const isSuccess = paymentStatus === "completed";
      const isFailed = paymentStatus === "failed";
      const isPending = paymentStatus === "pending";

      req.log?.info?.({ orderId: order._id, paymentStatus }, "Payment status from DB");

      res.json(VerifyPaymentResponse.parse({
        success: isSuccess,
        status: isSuccess ? "success" : (isFailed ? "failed" : "pending"),
        orderId: (order._id as string) ?? null,
        message: isSuccess ? "Payment completed" : (isFailed ? "Payment failed" : "Payment pending"),
      }));
      return;
    } catch (error) {
      req.log?.error?.({ err: error, reference }, "Payment verification error");
      res.json(VerifyPaymentResponse.parse({ 
        success: false, 
        status: "failed", 
        orderId: null,
        message: error instanceof Error ? error.message : "Unknown error" 
      }));
      return;
    }
  }

  // Paystack Verification (Fallback)
  if (!PAYSTACK_SECRET) {
    const order = await convex.query(api.orders.getByPaystackRef, {
      reference,
      customerId: isAdmin ? undefined : (req.user?.userId as any),
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
    customerId: isAdmin ? undefined : (req.user?.userId as any),
  }) as Record<string, unknown> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (order) await convex.mutation(api.orders.updatePayment, { id: order._id as any, paymentStatus: payStatus });

  res.json(VerifyPaymentResponse.parse({ success: data.data.status === "success", status: data.data.status, orderId: (order?._id as string) ?? null }));
});

// POST /api/payments/webhook/lipana - Lipana webhook handler
router.post("/webhook/lipana", async (req, res) => {
  try {
    const signature = req.headers["x-lipana-signature"] as string;
    const webhookSecret = process.env.LIPANA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      req.log?.error?.("Webhook secret not configured");
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    // Verify webhook signature using RAW request body
    const lipana = getLipanaClient();
    const rawBody = (req as any).rawBody || (req as any).body;
    const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(req.body);
    const isValid = lipana.verifyWebhookSignature(payload, signature, webhookSecret);

    if (!isValid) {
      req.log?.warn?.({ signature: "***" }, "Invalid webhook signature");
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    const webhookData = req.body;
    const checkoutRequestId = webhookData.checkout_request_id;

    req.log?.info?.({ checkoutRequestId, event: webhookData.event }, "Received Lipana webhook");

    // Find order by payment reference
    const order = await convex.query(api.orders.getByPaystackRef, {
      reference: checkoutRequestId,
    }) as Record<string, unknown> | null;

    if (!order) {
      req.log?.warn?.({ checkoutRequestId }, "Order not found for webhook");
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // IDEMPOTENCY CHECK: If order is already completed, return success
    if (order.paymentStatus === "completed") {
      req.log?.info?.({ orderId: order._id, checkoutRequestId }, "Order already completed, skipping webhook");
      res.json({ success: true, message: "Webhook processed successfully (idempotent)" });
      return;
    }

    // Update payment status based on webhook event
    let paymentStatus: "pending" | "completed" | "failed" = "pending";
    
    if (webhookData.event === "payment.success" || webhookData.result_code === "0") {
      paymentStatus = "completed";
      req.log?.info?.({ orderId: order._id, checkoutRequestId }, "Payment completed via webhook");
    } else if (webhookData.event === "payment.failed" || webhookData.result_code !== "0") {
      paymentStatus = "failed";
      req.log?.info?.({ orderId: order._id, checkoutRequestId, resultDesc: webhookData.result_desc }, "Payment failed via webhook");
    }

    await convex.mutation(api.orders.updatePayment, {
      id: order._id as any,
      paymentStatus,
    });

    res.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    req.log?.error?.({ err: error }, "Webhook processing failed");
    res.status(500).json({ 
      error: "Webhook processing failed",
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// GET /api/payments/:reference/status - Get payment status by reference
router.get("/:reference/status", optionalAuth, async (req, res) => {
  const { reference } = req.params;
  const isAdmin = req.user?.role === "admin";

  req.log?.info?.({ reference, isAdmin }, "Payment status request");

  // Lipana M-Pesa Status - READ FROM DB ONLY (source of truth)
  if (PAYMENT_PROVIDER === "lipana") {
    try {
      // Find order by reference - this is our source of truth
      const order = await convex.query(api.orders.getByPaystackRef, {
        reference,
        customerId: isAdmin ? undefined : (req.user?.userId as any),
      }) as Record<string, unknown> | null;

      if (!order) {
        req.log?.warn?.({ reference }, "Order not found for status check");
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      // Return the status from our database (webhook-updated)
      const paymentStatus = order.paymentStatus as string;
      const isSuccess = paymentStatus === "completed";
      const isFailed = paymentStatus === "failed";
      const isPending = paymentStatus === "pending";

      req.log?.info?.({ orderId: order._id, paymentStatus }, "Payment status from DB");

      res.json({
        success: isSuccess,
        status: isSuccess ? "success" : (isFailed ? "failed" : "pending"),
        orderId: (order._id as string) ?? null,
        message: isSuccess ? "Payment completed" : (isFailed ? "Payment failed" : "Payment pending"),
      });
      return;
    } catch (error) {
      req.log?.error?.({ err: error, reference }, "Payment status check error");
      res.status(500).json({ 
        error: "Failed to check payment status",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
      return;
    }
  }

  // Paystack fallback
  res.status(501).json({ error: "Payment provider not configured" });
});

export default router;
