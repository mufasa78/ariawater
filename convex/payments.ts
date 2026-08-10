import { mutation, query, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";

export const getPayment = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, { paymentId }) => {
    return ctx.db.get(paymentId);
  },
});

export const getPaymentForAction = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) return null;
    const order = await ctx.db.get(payment.orderId);
    return { payment, order };
  },
});

export const createPayment = mutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    phone: v.string(),
  },
  handler: async (ctx, { orderId, amount, phone }) => {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new ConvexError("Order not found");
    }

    const paymentId = await ctx.db.insert("payments", {
      orderId,
      provider: "lipana",
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── Queries ───────────────────────────────────────────────────────────────────

export const getByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .first();
    return payment;
  },
});

export const getByProviderTransactionId = query({
  args: { providerTransactionId: v.string() },
  handler: async (ctx, { providerTransactionId }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_provider_transaction", (q) => q.eq("providerTransactionId", providerTransactionId))
      .first();
    return payment;
  },
});

export const getById = query({
  args: { id: v.id("payments") },
  handler: async (ctx, { id }) => {
    const payment = await ctx.db.get(id);
    return payment;
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    orderId: v.id("orders"),
    provider: v.string(), // "lipana", "paystack"
    amount: v.number(),
    phone: v.string(),
  },
  handler: async (ctx, { orderId, provider, amount, phone }) => {
    const order = await ctx.db.get(orderId);
    if (!order) throw new ConvexError("Order not found");

    const paymentId = await ctx.db.insert("payments", {
      orderId,
      provider,
      amount,
      phone,
      status: "pending",
      createdAt: Date.now(),
    });

    return paymentId;
  },
});

export const markByProviderTransactionId = mutation({
  args: {
    providerTransactionId: v.string(),
    successful: v.boolean(),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, { providerTransactionId, successful, failureReason }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_provider_transaction", (q) => q.eq("providerTransactionId", providerTransactionId))
      .first();
    if (!payment) throw new ConvexError("Payment not found");
    if (payment.status === "successful" || payment.status === "failed") return;

    const completedAt = Date.now();
    await ctx.db.patch(payment._id, {
      status: successful ? "successful" : "failed",
      completedAt,
      failureReason,
    });
    await ctx.db.patch(payment.orderId, {
      paymentStatus: successful ? "completed" : "failed",
      ...(successful ? { status: "processing" } : {}),
      updatedAt: completedAt,
    });
  },
});

export const markPaymentSuccessful = internalMutation({
  args: {
    providerTransactionId: v.string(),
    providerReference: v.optional(v.string()),
    completedAt: v.number(),
  },
  handler: async (ctx, { providerTransactionId, providerReference, completedAt }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_provider_transaction", (q) =>
        q.eq("providerTransactionId", providerTransactionId)
      )
      .first();

    if (!payment) {
      console.warn(`Payment not found for provider transaction: ${providerTransactionId}`);
      return { success: false, message: "Payment not found" };
    }

    if (payment.status === "successful") {
      // Idempotent: already successful
      return { success: true, message: "Payment already marked successful" };
    }

    // Update payment
    await ctx.db.patch(payment._id, {
      status: "successful",
      completedAt,
      providerReference,
    });

    // Update order
    const order = await ctx.db.get(payment.orderId);
    if (order) {
      await ctx.db.patch(payment.orderId, {
        paymentStatus: "completed",
        status: "processing",
        updatedAt: completedAt,
      });
    }

    return { success: true };
  },
});

export const markPaymentFailed = internalMutation({
  args: {
    providerTransactionId: v.string(),
    failureReason: v.optional(v.string()),
    completedAt: v.number(),
  },
  handler: async (ctx, { providerTransactionId, failureReason, completedAt }) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_provider_transaction", (q) =>
        q.eq("providerTransactionId", providerTransactionId)
      )
      .first();

    if (!payment) {
      console.warn(`Payment not found for provider transaction: ${providerTransactionId}`);
      return { success: false, message: "Payment not found" };
    }

    if (payment.status === "failed" || payment.status === "successful") {
      return { success: true, message: "Payment is already in final state" };
    }

    // Update payment
    await ctx.db.patch(payment._id, {
      status: "failed",
      completedAt,
      failureReason,
    });

    // Update order
    const order = await ctx.db.get(payment.orderId);
    if (order) {
      await ctx.db.patch(payment.orderId, {
        paymentStatus: "failed",
        updatedAt: completedAt,
      });
    }

    return { success: true };
  },
});

// Update the payment record with Lipana's transaction ID after initiation.
// This public mutation is used by the Express API after it has initiated the provider request.
export const markFailedById = mutation({
  args: {
    paymentId: v.id("payments"),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, { paymentId, failureReason }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new ConvexError("Payment not found");
    if (payment.status === "successful") return;

    await ctx.db.patch(paymentId, {
      status: "failed",
      failureReason,
      completedAt: Date.now(),
    });
    await ctx.db.patch(payment.orderId, {
      paymentStatus: "failed",
      updatedAt: Date.now(),
    });
  },
});

export const updateTransactionId = mutation({
  args: {
    paymentId: v.id("payments"),
    providerTransactionId: v.string(),
    status: v.union(v.literal("initiated"), v.literal("failed")),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, { paymentId, providerTransactionId, status, failureReason }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) {
      throw new ConvexError("Payment not found");
    }

    await ctx.db.patch(paymentId, {
      providerTransactionId,
      status,
      failureReason,
    });
  },
});

export const initiateLipana = action({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, { paymentId }) => {
    // 1. Get payment and order details
    const data = await ctx.runQuery(internal.payments.getPaymentForAction, { paymentId });
    if (!data) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    const { payment, order } = data;
    if (!order) {
      throw new Error(`Order with ID ${payment.orderId} not found`);
    }

    // 2. Fetch Lipana keys from Convex environment
    const secretKey = process.env.LIPANA_SECRET_KEY;
    if (!secretKey) {
      throw new Error("LIPANA_SECRET_KEY is not configured in Convex environment variables");
    }

    const isProduction = process.env.LIPANA_ENVIRONMENT === "production";
    const baseUrl = isProduction
      ? "https://api.lipana.africa/v1"
      : "https://sandbox.lipana.africa/v1";

    // 3. Format Phone Number (254XXXXXXXXX)
    let cleaned = payment.phone.replace(/[\s\-+]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1);
    }
    if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }

    const payload = {
      amount: payment.amount,
      phone_number: cleaned,
      account_reference: order.ticketNumber || order._id,
      transaction_desc: `Ari Water order ${order.ticketNumber || order._id}`,
    };

    console.log(`Initiating Lipana STK Push for payment ${paymentId}`, {
      amount: payload.amount,
      phone: payload.phone_number,
      ref: payload.account_reference,
    });

    try {
      const response = await fetch(`${baseUrl}/payments/stk-push`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        console.error("Lipana STK Push request failed", resData);
        const errMsg = resData.message || resData.error || "Payment initiation failed";

        await ctx.runMutation(internal.payments.updateTransactionId, {
          paymentId,
          providerTransactionId: "error-" + Date.now(),
          status: "failed",
          failureReason: errMsg,
        });

        return { success: false, error: errMsg };
      }

      console.log("Lipana STK Push initiated successfully", resData);

      const checkoutRequestId = resData.data?.checkout_request_id || resData.checkout_request_id;
      if (!checkoutRequestId) {
        throw new Error("Missing checkout_request_id in Lipana response");
      }

      // 4. Update the payment with provider transaction ID
      await ctx.runMutation(internal.payments.updateTransactionId, {
        paymentId,
        providerTransactionId: checkoutRequestId,
        status: "initiated",
      });

      return {
        success: true,
        paymentId,
        providerTransactionId: checkoutRequestId,
        status: "initiated",
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown network error";
      console.error("Error initiating payment with Lipana", error);

      await ctx.runMutation(internal.payments.updateTransactionId, {
        paymentId,
        providerTransactionId: "error-" + Date.now(),
        status: "failed",
        failureReason: errMsg,
      });

      return { success: false, error: errMsg };
    }
    return ctx.db.get(paymentId);
  },
});

export const updateProviderTransactionId = mutation({
  args: {
    id: v.id("payments"),
    providerTransactionId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("initiated"),
      v.literal("successful"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
  },
  handler: async (ctx, { id, providerTransactionId, status }) => {
    const payment = await ctx.db.get(id);
    if (!payment) throw new ConvexError("Payment not found");

    await ctx.db.patch(id, {
      providerTransactionId,
      status,
    });

    return ctx.db.get(id);
  },
});

export const markSuccessful = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, { id }) => {
    const payment = await ctx.db.get(id);
    if (!payment) throw new ConvexError("Payment not found");

    const now = Date.now();
    await ctx.db.patch(id, {
      status: "successful",
      completedAt: now,
    });

    // Update order status
    await ctx.db.patch(payment.orderId, {
      paymentStatus: "completed",
      status: "processing",
      updatedAt: now,
    });

    return ctx.db.get(id);
  },
});

export const markFailed = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, { id }) => {
    const payment = await ctx.db.get(id);
    if (!payment) throw new ConvexError("Payment not found");

    const now = Date.now();
    await ctx.db.patch(id, {
      status: "failed",
      completedAt: now,
    });

    // Update order status
    await ctx.db.patch(payment.orderId, {
      paymentStatus: "failed",
      updatedAt: now,
    });

    return ctx.db.get(id);
  },
});

export const markCancelled = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, { id }) => {
    const payment = await ctx.db.get(id);
    if (!payment) throw new ConvexError("Payment not found");

    const now = Date.now();
    await ctx.db.patch(id, {
      status: "cancelled",
      completedAt: now,
    });

    // Update order status
    await ctx.db.patch(payment.orderId, {
      paymentStatus: "failed",
      updatedAt: now,
    });

    return ctx.db.get(id);
  },
});

export const markExpired = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, { id }) => {
    const payment = await ctx.db.get(id);
    if (!payment) throw new ConvexError("Payment not found");

    const now = Date.now();
    await ctx.db.patch(id, {
      status: "expired",
      completedAt: now,
    });

    // Update order status
    await ctx.db.patch(payment.orderId, {
      paymentStatus: "failed",
      updatedAt: now,
    });

    return ctx.db.get(id);
  },
});
