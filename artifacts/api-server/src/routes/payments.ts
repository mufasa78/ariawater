import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { requireAuth } from "../middlewares/auth.js";
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

// POST /api/payments/initialize
router.post("/initialize", requireAuth, async (req, res) => {
  const parsed = InitializePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const isAdmin = req.user!.role === "admin";
  const order = await convex.query(api.orders.get, { id: parsed.data.orderId as any }) as Record<string, unknown> | null;
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (!isAdmin && order.customerId !== req.user!.userId) { res.status(403).json({ error: "Access denied" }); return; }

  // Lipana M-Pesa Payment
  if (PAYMENT_PROVIDER === "lipana") {
    try {
      const lipana = getLipanaClient();
      const phoneNumber = order.phone as string;

      // Validate and format phone number
      if (!LipanaClient.isValidKenyanPhone(phoneNumber)) {
        res.status(400).json({ error: "Invalid Kenyan phone number format" });
        return;
      }

      const formattedPhone = LipanaClient.formatPhoneNumber(phoneNumber);
      const reference = `ARI-${parsed.data.orderId}-${Date.now()}`;

      // Build webhook callback URL: use explicit env var, else derive from Replit domain
      const webhookUrl =
        process.env.LIPANA_WEBHOOK_URL ||
        (process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/payments/webhook/lipana`
          : undefined);

      const paymentResult = await lipana.initiatePayment({
        amount: Math.round(order.totalKes as number),
        phone_number: formattedPhone,
        account_reference: reference,
        transaction_desc: `Ari Water Order #${parsed.data.orderId}`,
        callback_url: webhookUrl,
      });

      if (!paymentResult.success || !paymentResult.data) {
        // Payment provider unreachable or rejected — order is already created.
        // Return a 200 with a degraded payload so the client can show a "pay later" UX
        // rather than treating this as a hard error.
        res.json(InitializePaymentResponse.parse({
          authorizationUrl: "",
          reference: reference,
          message: paymentResult.message || "M-Pesa prompt could not be sent at this time. You can complete payment from your orders page.",
        }));
        return;
      }

      // Update order with payment reference
      await convex.mutation(api.orders.updatePayment, {
        id: parsed.data.orderId as any,
        paystackRef: paymentResult.data.checkout_request_id,
        paymentStatus: "pending",
      });

      res.json(InitializePaymentResponse.parse({
        authorizationUrl: `mpesa://stk-push/${paymentResult.data.checkout_request_id}`,
        reference: paymentResult.data.checkout_request_id,
        message: paymentResult.data.customer_message,
      }));
      return;
    } catch (error) {
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

  // Lipana M-Pesa Verification
  if (PAYMENT_PROVIDER === "lipana") {
    try {
      const lipana = getLipanaClient();
      const statusResult = await lipana.checkPaymentStatus(reference);

      if (!statusResult.success || !statusResult.data) {
        res.json(VerifyPaymentResponse.parse({ 
          success: false, 
          status: "failed", 
          orderId: null,
          message: statusResult.error || "Failed to verify payment" 
        }));
        return;
      }

      const isSuccess = statusResult.data.result_code === "0";
      const payStatus = isSuccess ? "completed" : "failed";

      const order = await convex.query(api.orders.getByPaystackRef, {
        reference,
        customerId: isAdmin ? undefined : req.user!.userId as any,
      }) as Record<string, unknown> | null;

      if (order) {
        await convex.mutation(api.orders.updatePayment, {
          id: order._id as any,
          paymentStatus: payStatus,
        });
      }

      res.json(VerifyPaymentResponse.parse({
        success: isSuccess,
        status: isSuccess ? "success" : "failed",
        orderId: (order?._id as string) ?? null,
        mpesaReceiptNumber: statusResult.data.mpesa_receipt_number,
        message: statusResult.data.result_desc,
      }));
      return;
    } catch (error) {
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

// POST /api/payments/webhook/lipana - Lipana webhook handler
router.post("/webhook/lipana", async (req, res) => {
  try {
    const signature = req.headers["x-lipana-signature"] as string;
    const webhookSecret = process.env.LIPANA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    // Verify webhook signature
    const lipana = getLipanaClient();
    const payload = JSON.stringify(req.body);
    const isValid = lipana.verifyWebhookSignature(payload, signature, webhookSecret);

    if (!isValid) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    const webhookData = req.body;
    const checkoutRequestId = webhookData.checkout_request_id;

    // Find order by payment reference
    const order = await convex.query(api.orders.getByPaystackRef, {
      reference: checkoutRequestId,
    }) as Record<string, unknown> | null;

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Update payment status based on webhook event
    let paymentStatus: "pending" | "completed" | "failed" = "pending";
    
    if (webhookData.event === "payment.success" || webhookData.result_code === "0") {
      paymentStatus = "completed";
    } else if (webhookData.event === "payment.failed") {
      paymentStatus = "failed";
    }

    await convex.mutation(api.orders.updatePayment, {
      id: order._id as any,
      paymentStatus,
    });

    res.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    res.status(500).json({ 
      error: "Webhook processing failed",
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export default router;
