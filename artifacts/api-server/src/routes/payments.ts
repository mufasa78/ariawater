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
      const orderTotal = Math.round(order.totalKes as number);

      // Validate minimum amount (Ksh 10)
      if (orderTotal < 10) {
        req.log?.warn?.({ orderId: parsed.data.orderId, amount: orderTotal }, "Amount below minimum Ksh 10");
        res.status(400).json({ error: "Minimum transaction amount is Ksh 10" });
        return;
      }

      req.log?.info?.({ orderId: parsed.data.orderId, phone: formattedPhone, amount: orderTotal }, "Initiating Lipana STK push");

      // STEP 1: Create Convex payment record first (fallback to order.paystackRef if payments table not deployed)
      let paymentId: string;
      let useFallback = false;
      
      try {
        const payment = await convex.mutation(api.payments.create, {
          orderId: parsed.data.orderId as any,
          provider: "lipana",
          amount: orderTotal,
          phone: formattedPhone,
        });
        paymentId = payment._id as string;
        req.log?.info?.({ orderId: parsed.data.orderId, paymentId }, "Convex payment record created");
      } catch (error) {
        // Fallback: payments table not deployed yet, use order.paystackRef
        useFallback = true;
        paymentId = `pending-${Date.now()}`;
        req.log?.warn?.({ orderId: parsed.data.orderId, error: error instanceof Error ? error.message : "Unknown" }, "Payments table not deployed, using fallback");
      }

      // STEP 2: Call Lipana with order.orderNumber as account reference
      const paymentResult = await lipana.initiatePayment({
        phone: formattedPhone,
        amount: orderTotal,
      });

      if (!paymentResult.success || !paymentResult.data) {
        // Payment provider unreachable or rejected
        req.log?.warn?.({ orderId: parsed.data.orderId, paymentId, message: paymentResult.message }, "Lipana STK initiation failed");
        if (!useFallback) {
          await convex.mutation(api.payments.markFailed, { id: paymentId as any });
        } else {
          // Store the pending reference in order.paystackRef so status endpoint can find it
          await convex.mutation(api.orders.updatePayment, { 
            id: parsed.data.orderId as any, 
            paystackRef: paymentId,
            paymentStatus: "failed" 
          });
        }
        res.json(InitializePaymentResponse.parse({
          authorizationUrl: "",
          reference: paymentId,
          amountKes: orderTotal,
          message: paymentResult.message || "M-Pesa prompt could not be sent at this time. You can complete payment from your orders page.",
        }));
        return;
      }

      // STEP 3: Persist Lipana transactionId
      if (!useFallback) {
        await convex.mutation(api.payments.updateProviderTransactionId, {
          id: paymentId as any,
          providerTransactionId: paymentResult.data.transactionId,
          status: "initiated",
        });
      } else {
        // Fallback: store Lipana transactionId in order.paystackRef
        await convex.mutation(api.orders.updatePayment, {
          id: parsed.data.orderId as any,
          paystackRef: paymentResult.data.transactionId,
          paymentStatus: "pending",
        });
        // Return the Lipana transactionId as reference for polling (not the pending reference)
        paymentId = paymentResult.data.transactionId;
      }

      req.log?.info?.({ orderId: parsed.data.orderId, paymentId, transactionId: paymentResult.data.transactionId, useFallback }, "Lipana STK initiated successfully");

      res.json(InitializePaymentResponse.parse({
        authorizationUrl: `mpesa://stk-push/${paymentResult.data.transactionId}`,
        reference: paymentId,
        amountKes: orderTotal,
        message: paymentResult.data.message,
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
    const transactionId = webhookData.data?.transactionId;
    const event = webhookData.event;

    req.log?.info?.({ transactionId, event }, "Received Lipana webhook");

    // Try to find payment by providerTransactionId (new approach)
    let payment = await convex.query(api.payments.getByProviderTransactionId, {
      providerTransactionId: transactionId,
    }) as Record<string, unknown> | null;

    // Fallback: try to find order by paystackRef (old approach)
    let order = null;
    if (!payment) {
      order = await convex.query(api.orders.getByPaystackRef, {
        reference: transactionId,
      }) as Record<string, unknown> | null;
      req.log?.info?.({ transactionId, orderFound: !!order }, "Using fallback order lookup");
    }

    if (!payment && !order) {
      req.log?.warn?.({ transactionId }, "Payment/order not found for webhook");
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    // IDEMPOTENCY CHECK
    if (payment && payment.status === "successful") {
      req.log?.info?.({ paymentId: payment._id, transactionId }, "Payment already successful, skipping webhook");
      res.json({ success: true, message: "Webhook processed successfully (idempotent)" });
      return;
    }
    if (order && order.paymentStatus === "completed") {
      req.log?.info?.({ orderId: order._id, transactionId }, "Order already completed, skipping webhook");
      res.json({ success: true, message: "Webhook processed successfully (idempotent)" });
      return;
    }

    // Update payment status based on webhook event
    if (event === "payment.success" || webhookData.data?.status === "success") {
      if (payment) {
        await convex.mutation(api.payments.markSuccessful, { id: payment._id as any });
        req.log?.info?.({ paymentId: payment._id, transactionId, orderId: payment.orderId }, "Payment marked successful via webhook");
      } else if (order) {
        await convex.mutation(api.orders.updatePayment, { id: order._id as any, paymentStatus: "completed" });
        req.log?.info?.({ orderId: order._id, transactionId }, "Order marked completed via webhook (fallback)");
      }
    } else if (event === "payment.failed" || webhookData.data?.status === "failed") {
      if (payment) {
        await convex.mutation(api.payments.markFailed, { id: payment._id as any });
        req.log?.info?.({ paymentId: payment._id, transactionId, orderId: payment.orderId }, "Payment marked failed via webhook");
      } else if (order) {
        await convex.mutation(api.orders.updatePayment, { id: order._id as any, paymentStatus: "failed" });
        req.log?.info?.({ orderId: order._id, transactionId }, "Order marked failed via webhook (fallback)");
      }
    } else if (event === "payment.cancelled") {
      if (payment) {
        await convex.mutation(api.payments.markCancelled, { id: payment._id as any });
        req.log?.info?.({ paymentId: payment._id, transactionId, orderId: payment.orderId }, "Payment marked cancelled via webhook");
      } else if (order) {
        await convex.mutation(api.orders.updatePayment, { id: order._id as any, paymentStatus: "failed" });
        req.log?.info?.({ orderId: order._id, transactionId }, "Order marked failed via webhook (fallback)");
      }
    } else if (event === "payment.expired") {
      if (payment) {
        await convex.mutation(api.payments.markExpired, { id: payment._id as any });
        req.log?.info?.({ paymentId: payment._id, transactionId, orderId: payment.orderId }, "Payment marked expired via webhook");
      } else if (order) {
        await convex.mutation(api.orders.updatePayment, { id: order._id as any, paymentStatus: "failed" });
        req.log?.info?.({ orderId: order._id, transactionId }, "Order marked failed via webhook (fallback)");
      }
    }

    res.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    req.log?.error?.({ err: error }, "Webhook processing failed");
    res.status(500).json({ 
      error: "Webhook processing failed",
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// GET /api/payments/:paymentId/status - Get payment status by Convex payment ID
router.get("/:paymentId/status", optionalAuth, async (req, res) => {
  const { paymentId } = req.params;
  const isAdmin = req.user?.role === "admin";

  req.log?.info?.({ paymentId, isAdmin }, "Payment status request");

  // Lipana M-Pesa Status - READ FROM DB ONLY (source of truth)
  if (PAYMENT_PROVIDER === "lipana") {
    try {
      // Try to find payment by Convex payment ID (new approach)
      let payment = await convex.query(api.payments.getById, {
        id: paymentId as any,
      }) as Record<string, unknown> | null;

      // Fallback: if paymentId starts with "pending-", try to find by paystackRef (old approach)
      let order = null;
      if (!payment && paymentId.startsWith("pending-")) {
        order = await convex.query(api.orders.getByPaystackRef, {
          reference: paymentId,
        }) as Record<string, unknown> | null;
        req.log?.info?.({ paymentId, orderFound: !!order }, "Using fallback order lookup for pending reference");
      }

      if (!payment && !order) {
        req.log?.warn?.({ paymentId }, "Payment/order not found for status check");
        // Return a failed status instead of 404 for pending references
        if (paymentId.startsWith("pending-")) {
          res.json({
            success: false,
            status: "failed",
            orderId: null,
            message: "Payment initiation failed. Please try again.",
          });
          return;
        }
        res.status(404).json({ error: "Payment not found", code: "PAYMENT_NOT_FOUND" });
        return;
      }

      // Return the status from our database (webhook-updated)
      let paymentStatus: string;
      let orderId: string | null;

      if (payment) {
        paymentStatus = payment.status as string;
        orderId = (payment.orderId as string) ?? null;
      } else {
        paymentStatus = order.paymentStatus as string;
        orderId = (order._id as string) ?? null;
      }

      const isSuccess = paymentStatus === "successful" || paymentStatus === "completed";
      const isFailed = paymentStatus === "failed";
      const isCancelled = paymentStatus === "cancelled";
      const isExpired = paymentStatus === "expired";
      const isPending = paymentStatus === "pending";
      const isInitiated = paymentStatus === "initiated";

      req.log?.info?.({ paymentId, paymentStatus, orderId, isFallback: !!order }, "Payment status from DB");

      res.json({
        success: isSuccess,
        status: isSuccess ? "success" : (isFailed || isCancelled || isExpired ? "failed" : (isInitiated ? "pending" : "pending")),
        orderId,
        message: isSuccess ? "Payment completed" : (isFailed ? "Payment failed" : (isCancelled ? "Payment cancelled" : (isExpired ? "Payment expired" : "Payment pending"))),
      });
      return;
    } catch (error) {
      req.log?.error?.({ err: error, paymentId }, "Payment status check error");
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
