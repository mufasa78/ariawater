import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { optionalAuth } from "../middlewares/auth.js";
import { getLipanaClient, LipanaClient } from "../lib/lipana-client.js";
import { InitializePaymentBody, InitializePaymentResponse, VerifyPaymentBody, VerifyPaymentResponse } from "@workspace/api-zod";

const router: Router = Router();
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "lipana";

router.post("/initialize", optionalAuth, async (req, res) => {
  const parsed = InitializePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const order = await convex.query(api.orders.get, { id: parsed.data.orderId as any }) as Record<string, unknown> | null;
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  const isAdmin = req.user?.role === "admin";
  if (req.user && !isAdmin && order.customerId && order.customerId !== req.user.userId) { res.status(403).json({ error: "Access denied" }); return; }

  const amountKes = Math.round(Number(order.totalKes));
  const phoneNumber = String(order.phone || "");
  if (PAYMENT_PROVIDER !== "lipana") {
    const reference = `ARI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    res.json({
      ...InitializePaymentResponse.parse({ authorizationUrl: `https://mock-paystack.test/pay/${reference}`, reference }),
      amountKes,
    });
    return;
  }
  if (!LipanaClient.isValidKenyanPhone(phoneNumber)) { res.status(400).json({ error: "Invalid Kenyan phone number format" }); return; }
  if (amountKes < 10) { res.status(400).json({ error: "Minimum transaction amount is Ksh 10" }); return; }

  try {
    const payment = await convex.mutation(api.payments.create, { orderId: parsed.data.orderId as any, provider: "lipana", amount: amountKes, phone: LipanaClient.formatPhoneNumber(phoneNumber) });
    const paymentId = payment._id as string;
    const result = await getLipanaClient().initiatePayment({ phone: LipanaClient.formatPhoneNumber(phoneNumber), amount: amountKes });
    if (!result.success || !result.data) {
      const message = result.message || "M-Pesa prompt could not be sent";
      await convex.mutation(api.payments.markFailedById, { paymentId: paymentId as any, failureReason: message });
      res.json({ ...InitializePaymentResponse.parse({ authorizationUrl: "", reference: paymentId }), amountKes, message });
      return;
    }
    const message = result.data.message || result.message;
    await convex.mutation(api.payments.updateTransactionId, { paymentId: paymentId as any, providerTransactionId: result.data.transactionId, status: "initiated" });
    res.json({ ...InitializePaymentResponse.parse({ authorizationUrl: `mpesa://stk-push/${result.data.transactionId}`, reference: paymentId }), amountKes, message });
  } catch (error) {
    req.log?.error?.({ err: error }, "Failed to initialize Lipana payment");
    res.status(502).json({ error: "Failed to initialize M-Pesa payment", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.post("/verify", optionalAuth, async (req, res) => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const payment = await convex.query(api.payments.getPayment, { paymentId: parsed.data.reference as any }) as Record<string, unknown> | null;
    const status = String(payment?.status || "pending");
    const mapped = status === "successful" ? "success" : (["failed", "cancelled", "expired"].includes(status) ? "failed" : "pending");
    res.json({ ...VerifyPaymentResponse.parse({ success: mapped === "success", status: mapped, orderId: payment?.orderId || null }), message: mapped === "success" ? "Payment was successful" : `Payment status: ${status}` });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Payment verification failed" });
  }
});

// GET /api/payments/:reference/status — polled by the checkout UI after an STK push
router.get("/:reference/status", optionalAuth, async (req, res) => {
  const reference = req.params.reference;
  if (!reference) { res.status(400).json({ error: "Missing payment reference" }); return; }
  try {
    let payment = await convex.query(api.payments.getPayment, { paymentId: reference as any }) as Record<string, unknown> | null;
    // Also accept a Lipana provider transaction ID as the reference
    if (!payment) {
      payment = await convex.query(api.payments.getByProviderTransactionId, { providerTransactionId: reference }) as Record<string, unknown> | null;
    }
    if (!payment) {
      res.status(404).json({ error: "Payment record not found", message: "Payment record not found. Please try again." });
      return;
    }
    const rawStatus = String(payment.status || "pending");
    const status = rawStatus === "successful" ? "success" : (["failed", "cancelled", "expired"].includes(rawStatus) ? "failed" : "pending");
    const message = status === "success"
      ? "Payment completed successfully"
      : (status === "failed" ? (payment.failureReason as string | undefined) || "Payment was declined or cancelled." : "Payment is pending");
    res.json({ ...VerifyPaymentResponse.parse({ success: status === "success", status, orderId: payment.orderId || null }), message });
  } catch (error) {
    req.log?.error?.({ err: error }, "Failed to fetch payment status");
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
});

router.post("/webhook/lipana", async (req, res) => {
  const signature = req.headers["x-lipana-signature"] as string | undefined;
  const secret = process.env.LIPANA_WEBHOOK_SECRET;
  if (!secret || !signature) { res.status(401).json({ error: "Invalid webhook signature" }); return; }
  
  // Get raw body for signature verification
  const rawBody = (req as any).rawBody;
  const raw = Buffer.isBuffer(rawBody)
    ? rawBody.toString("utf8")
    : JSON.stringify(req.body);
  
  if (!getLipanaClient().verifyWebhookSignature(raw, signature, secret)) { res.status(401).json({ error: "Invalid webhook signature" }); return; }
  const transactionId = req.body?.data?.transactionId;
  if (!transactionId) { res.status(400).json({ error: "Missing transactionId" }); return; }
  const payment = await convex.query(api.payments.getByProviderTransactionId, { providerTransactionId: transactionId }) as Record<string, unknown> | null;
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  const successful = req.body?.event === "payment.success" || req.body?.data?.status === "success";
  await convex.mutation(api.payments.markByProviderTransactionId, {
    providerTransactionId: transactionId,
    successful,
    failureReason: successful ? undefined : req.body?.data?.message || "Lipana payment failed",
  });
  res.json({ success: true });
});

export default router;
