import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
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
        if (!order)
            throw new ConvexError("Order not found");
        const paymentId = await ctx.db.insert("payments", {
            orderId,
            provider,
            amount,
            phone,
            status: "pending",
            createdAt: Date.now(),
        });
        return ctx.db.get(paymentId);
    },
});
export const updateProviderTransactionId = mutation({
    args: {
        id: v.id("payments"),
        providerTransactionId: v.string(),
        status: v.union(v.literal("pending"), v.literal("initiated"), v.literal("successful"), v.literal("failed"), v.literal("cancelled"), v.literal("expired")),
    },
    handler: async (ctx, { id, providerTransactionId, status }) => {
        const payment = await ctx.db.get(id);
        if (!payment)
            throw new ConvexError("Payment not found");
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
        if (!payment)
            throw new ConvexError("Payment not found");
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
        if (!payment)
            throw new ConvexError("Payment not found");
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
        if (!payment)
            throw new ConvexError("Payment not found");
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
        if (!payment)
            throw new ConvexError("Payment not found");
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
