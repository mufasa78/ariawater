import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const getByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) =>
    ctx.db.query("payments").withIndex("by_order", (q) => q.eq("orderId", orderId)).order("desc").first(),
});

export const getPayment = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, { paymentId }) => ctx.db.get(paymentId),
});

export const getByProviderTransactionId = query({
  args: { providerTransactionId: v.string() },
  handler: async (ctx, { providerTransactionId }) =>
    ctx.db.query("payments").withIndex("by_provider_transaction", (q) => q.eq("providerTransactionId", providerTransactionId)).first(),
});

export const create = mutation({
  args: {
    orderId: v.id("orders"),
    provider: v.string(),
    amount: v.number(),
    phone: v.string(),
  },
  handler: async (ctx, { orderId, provider, amount, phone }) => {
    const order = await ctx.db.get(orderId);
    if (!order) throw new ConvexError("Order not found");
    if (Math.round(amount) !== Math.round(order.totalKes)) {
      throw new ConvexError("Payment amount does not match order total");
    }
    const existing = await ctx.db.query("payments").withIndex("by_order", (q) => q.eq("orderId", orderId)).order("desc").first();
    if (existing && ["pending", "initiated"].includes(existing.status)) return existing;
    const paymentId = await ctx.db.insert("payments", {
      orderId, provider: "lipana" as const, amount: Math.round(amount), phone, status: "pending", createdAt: Date.now(),
    });
    return ctx.db.get(paymentId);
  },
});

export const updateTransactionId = mutation({
  args: {
    paymentId: v.id("payments"),
    providerTransactionId: v.string(),
    status: v.union(v.literal("initiated"), v.literal("failed")),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new ConvexError("Payment not found");
    await ctx.db.patch(args.paymentId, {
      providerTransactionId: args.providerTransactionId,
      status: args.status,
      failureReason: args.failureReason,
      ...(args.status === "failed" ? { completedAt: Date.now() } : {}),
    });
    if (args.status === "failed") await ctx.db.patch(payment.orderId, { paymentStatus: "failed", updatedAt: Date.now() });
    return ctx.db.get(args.paymentId);
  },
});

// Public mutation - called from both HTTP endpoint and API server
export const markByProviderTransactionId = mutation({
  args: {
    providerTransactionId: v.string(),
    successful: v.boolean(),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, { providerTransactionId, successful, failureReason }) => {
    const payment = await ctx.db.query("payments").withIndex("by_provider_transaction", (q) => q.eq("providerTransactionId", providerTransactionId)).first();
    if (!payment) throw new ConvexError("Payment not found");
    if (["successful", "failed"].includes(payment.status)) return payment;
    const now = Date.now();
    await ctx.db.patch(payment._id, { status: successful ? "successful" : "failed", completedAt: now, failureReason });
    await ctx.db.patch(payment.orderId, {
      paymentStatus: successful ? "completed" : "failed",
      ...(successful ? { status: "processing" as const } : {}),
      updatedAt: now,
    });
    return ctx.db.get(payment._id);
  },
});

// Internal mutation - called from HTTP handler webhook
export const markByProviderTransactionIdInternal = internalMutation({
  args: {
    providerTransactionId: v.string(),
    successful: v.boolean(),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, { providerTransactionId, successful, failureReason }) => {
    const payment = await ctx.db.query("payments").withIndex("by_provider_transaction", (q) => q.eq("providerTransactionId", providerTransactionId)).first();
    if (!payment) throw new ConvexError("Payment not found");
    if (["successful", "failed"].includes(payment.status)) return payment;
    const now = Date.now();
    await ctx.db.patch(payment._id, { status: successful ? "successful" : "failed", completedAt: now, failureReason });
    await ctx.db.patch(payment.orderId, {
      paymentStatus: successful ? "completed" : "failed",
      ...(successful ? { status: "processing" as const } : {}),
      updatedAt: now,
    });
    return ctx.db.get(payment._id);
  },
});

export const markFailedById = mutation({
  args: { paymentId: v.id("payments"), failureReason: v.optional(v.string()) },
  handler: async (ctx, { paymentId, failureReason }) => {
    const payment = await ctx.db.get(paymentId);
    if (!payment) throw new ConvexError("Payment not found");
    if (["successful", "failed"].includes(payment.status)) return payment;
    const now = Date.now();
    await ctx.db.patch(paymentId, { status: "failed", failureReason, completedAt: now });
    await ctx.db.patch(payment.orderId, { paymentStatus: "failed", updatedAt: now });
    return ctx.db.get(paymentId);
  },
});

export const markSuccessful = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, { id }) => {
    const payment = await ctx.db.get(id);
    if (!payment) throw new ConvexError("Payment not found");
    if (!payment.providerTransactionId) throw new ConvexError("Payment has no provider transaction ID");
    if (["successful", "failed"].includes(payment.status)) return payment;
    const now = Date.now();
    await ctx.db.patch(id, { status: "successful", completedAt: now });
    await ctx.db.patch(payment.orderId, { paymentStatus: "completed", status: "processing", updatedAt: now });
    return ctx.db.get(id);
  },
});

export const markFailed = mutation({
  args: { id: v.id("payments"), failureReason: v.optional(v.string()) },
  handler: async (ctx, { id, failureReason }) => {
    const payment = await ctx.db.get(id);
    if (!payment) throw new ConvexError("Payment not found");
    if (["successful", "failed"].includes(payment.status)) return payment;
    const now = Date.now();
    await ctx.db.patch(id, { status: "failed", failureReason, completedAt: now });
    await ctx.db.patch(payment.orderId, { paymentStatus: "failed", updatedAt: now });
    return ctx.db.get(id);
  },
});

export const updateProviderTransactionId = mutation({
  args: { id: v.id("payments"), providerTransactionId: v.string(), status: v.union(v.literal("pending"), v.literal("initiated"), v.literal("successful"), v.literal("failed"), v.literal("cancelled"), v.literal("expired")) },
  handler: async (ctx, { id, providerTransactionId, status }) => {
    const payment = await ctx.db.get(id);
    if (!payment) throw new ConvexError("Payment not found");
    await ctx.db.patch(id, { providerTransactionId, status });
    return ctx.db.get(id);
  },
});
