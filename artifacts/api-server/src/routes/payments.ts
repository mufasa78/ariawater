import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { optionalAuth } from "../middlewares/auth.js";
import {
  InitializePaymentBody,
  InitializePaymentResponse,
  VerifyPaymentBody,
  VerifyPaymentResponse,
} from "@workspace/api-zod";

const router: Router = Router();

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "lipana"; // lipana | paystack

// POST /api/payments/initialize - Support both authenticated and guest checkout
router.post("/initialize", optionalAuth, async (req, res) => {
  const parsed = InitializePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const isAdmin = req.user?.role === "admin";
  const order = await convex.query(api.orders.get, { id: parsed.data.orderId as any }) as Record<string, unknown> | null;
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  
  // Only check ownership if user is authenticated (not guest) and the order belongs to a customer
  if (req.user && !isAdmin && order.customerId && order.customerId !== req.user.userId){
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // Lipana M-Pesa Payment via Convex Action
  if (PAYMENT_PROVIDER === "lipana") {
    try {
      console.log(`Initializing Lipana payment for order ${parsed.data.orderId} via Convex`);

      // 1. Create a payment record in Convex
      const paymentId = await convex.mutation(api.payments.createPayment, {
        orderId: parsed.data.orderId as any,
        amount: Math.round(order.totalKes as number),
        phone: order.phone as string,
      }) as string;

      // 2. Trigger the Convex Action to initiate STK Push via Lipana
      const result = await convex.action(api.payments.initiateLipana, {
        paymentId: paymentId as any,
      }) as { success: boolean; error?: string; providerTransactionId?: string };

      if (!result.success) {
        console.error("Lipana STK Push initiation failed inside Convex action", result.error);

        // Return a 200 with a degraded payload so the client can show a "pay later" UX
        res.json(InitializePaymentResponse.parse({
          authorizationUrl: "",
          reference: paymentId, // Return Convex paymentId as reference
          message: result.error || "M-Pesa prompt could not be sent at this time. You can complete payment from your orders page.",
        }));
        return;
      }

      console.log(`Lipana payment initiated. Convex PaymentId: ${paymentId}, TransactionId: ${result.providerTransactionId}`);

      res.json(InitializePaymentResponse.parse({
        authorizationUrl: `mpesa://stk-push/${result.providerTransactionId}`,
        reference: paymentId, // Return Convex paymentId as reference
        message: "An M-Pesa payment prompt has been sent to your phone. Enter your PIN to complete.",
      }));
      return;
    } catch (error) {
      console.error("Failed to initialize payment via Convex", error);
      res.status(500).json({ 
        error: "Failed to initialize M-Pesa payment",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
      return;
    }
  }

  // Fallback / paystack mock mode
  const mockRef = `ARI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  res.json(InitializePaymentResponse.parse({ authorizationUrl: `https://mock-paystack.test/pay/${mockRef}`, reference: mockRef }));
});

// POST /api/payments/verify - Support both authenticated and guest checkout
router.post("/verify", optionalAuth, async (req, res) => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { reference } = parsed.data;

  // Lipana M-Pesa Verification via Convex Query
  if (PAYMENT_PROVIDER === "lipana") {
    try {
      console.log(`Verifying Lipana payment for reference (paymentId): ${reference}`);

      // Query Convex directly for payment status
      const payment = await convex.query(api.payments.getPayment, {
        paymentId: reference as any,
      }) as Record<string, any> | null;

      if (!payment) {
        console.warn(`No payment found in Convex for paymentId: ${reference}`);
        res.json(VerifyPaymentResponse.parse({ 
          success: false, 
          status: "failed", 
          orderId: null,
          message: "Payment not found"
        }));
        return;
      }

      const isSuccess = payment.status === "successful";

      res.json(VerifyPaymentResponse.parse({
        success: isSuccess,
        status: isSuccess ? "success" : payment.status,
        orderId: payment.orderId,
        mpesaReceiptNumber: payment.providerReference || undefined,
        message: payment.failureReason || (isSuccess ? "Payment was successful" : `Payment status: ${payment.status}`),
      }));
      return;
    } catch (error) {
      console.error("Failed to verify payment via Convex", error);
      res.json(VerifyPaymentResponse.parse({ 
        success: false, 
        status: "failed", 
        orderId: null,
        message: error instanceof Error ? error.message : "Unknown error" 
      }));
      return;
    }
  }

  // Paystack Fallback
  res.json(VerifyPaymentResponse.parse({ success: true, status: "success", orderId: null }));
});

// POST /api/payments/webhook/lipana - Lipana webhook handler (proxies to Convex HTTP Action)
router.post("/webhook/lipana", async (req, res) => {
  try {
    const signature = req.headers["x-lipana-signature"] as string;
    const convexUrl = process.env.CONVEX_URL ?? process.env.CONVEX_DEPLOYMENT_URL;

    if (!convexUrl) {
      res.status(500).json({ error: "Convex URL not configured" });
      return;
    }

    // Derive Convex Site URL from Convex Cloud URL (e.g. replace .cloud with .site)
    const convexSiteUrl = convexUrl.replace(/\.cloud$/, ".site");
    console.log(`Proxying Lipana Webhook to Convex HTTP Action: ${convexSiteUrl}/lipana/webhook`);

    // Proxy webhook payload to Convex HTTP Action
    const proxyRes = await fetch(`${convexSiteUrl}/lipana/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lipana-Signature": signature,
      },
      body: JSON.stringify(req.body),
    });

    const data = await proxyRes.text();
    res.status(proxyRes.status).send(data);
  } catch (error) {
    console.error("Proxy webhook to Convex failed", error);
    res.status(500).json({ 
      error: "Webhook proxy failed",
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export default router;
