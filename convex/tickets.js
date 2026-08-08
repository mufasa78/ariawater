import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
// ── Queries ───────────────────────────────────────────────────────────────────
export const getByOrder = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, { orderId }) => {
        return await ctx.db
            .query("tickets")
            .withIndex("by_order", (q) => q.eq("orderId", orderId))
            .first();
    },
});
export const getByTicketNumber = query({
    args: { ticketNumber: v.string() },
    handler: async (ctx, { ticketNumber }) => {
        return await ctx.db
            .query("tickets")
            .withIndex("by_ticketNumber", (q) => q.eq("ticketNumber", ticketNumber))
            .first();
    },
});
export const getTrackInfo = query({
    args: { ticketNumber: v.string() },
    handler: async (ctx, { ticketNumber }) => {
        const ticket = await ctx.db
            .query("tickets")
            .withIndex("by_ticketNumber", (q) => q.eq("ticketNumber", ticketNumber))
            .first();
        if (!ticket)
            return null;
        const order = await ctx.db.get(ticket.orderId);
        if (!order)
            return null;
        const items = await ctx.db
            .query("orderItems")
            .withIndex("by_order", (q) => q.eq("orderId", order._id))
            .collect();
        // Enrich items with product info
        const enrichedItems = await Promise.all(items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return {
                ...item,
                productName: product?.name ?? null,
                imageUrl: product?.imageUrl ?? null,
            };
        }));
        return {
            ticket,
            order: {
                ...order,
                items: enrichedItems,
            },
        };
    },
});
export const listAll = query({
    args: {
        status: v.optional(v.union(v.literal("open"), v.literal("resolved"), v.literal("closed"))),
        page: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { status, page = 1, limit = 50 }) => {
        let all = await ctx.db.query("tickets").order("desc").collect();
        if (status) {
            all = all.filter((t) => t.status === status);
        }
        const total = all.length;
        const offset = (page - 1) * limit;
        const tickets = all.slice(offset, offset + limit);
        return { tickets, total, page, limit };
    },
});
// ── Mutations ─────────────────────────────────────────────────────────────────
export const create = mutation({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, { orderId }) => {
        const order = await ctx.db.get(orderId);
        if (!order) {
            throw new ConvexError("Order not found");
        }
        const existingTicket = await ctx.db
            .query("tickets")
            .withIndex("by_order", (q) => q.eq("orderId", orderId))
            .first();
        if (existingTicket) {
            return existingTicket;
        }
        // Generate a simple ticket number
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        const ticketNumber = `AW-${datePrefix}-${randomSuffix}`;
        const now = Date.now();
        const ticketId = await ctx.db.insert("tickets", {
            orderId,
            ticketNumber,
            status: "open",
            messages: [
                {
                    sender: "system",
                    text: `Ticket created for order tracking. Order status: ${order.status}`,
                    timestamp: now,
                }
            ],
            createdAt: now,
            updatedAt: now,
        });
        return ctx.db.get(ticketId);
    },
});
export const addMessage = mutation({
    args: {
        ticketId: v.id("tickets"),
        sender: v.union(v.literal("customer"), v.literal("support"), v.literal("system")),
        text: v.string(),
    },
    handler: async (ctx, { ticketId, sender, text }) => {
        const ticket = await ctx.db.get(ticketId);
        if (!ticket) {
            throw new ConvexError("Ticket not found");
        }
        const now = Date.now();
        const messages = [...ticket.messages, { sender, text, timestamp: now }];
        await ctx.db.patch(ticketId, {
            messages,
            updatedAt: now,
            ...(sender === "customer" && ticket.status === "closed" ? { status: "open" } : {})
        });
        return ctx.db.get(ticketId);
    },
});
export const updateStatus = mutation({
    args: {
        ticketId: v.id("tickets"),
        status: v.union(v.literal("open"), v.literal("resolved"), v.literal("closed")),
    },
    handler: async (ctx, { ticketId, status }) => {
        const ticket = await ctx.db.get(ticketId);
        if (!ticket)
            throw new ConvexError("Ticket not found");
        await ctx.db.patch(ticketId, { status, updatedAt: Date.now() });
        return ctx.db.get(ticketId);
    },
});
