import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const create = mutation({
  args: {
    orderId: v.id("orders"),
    customerId: v.string(), // supports Clerk string IDs as well as old Convex user IDs
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, customerId, rating, comment }) => {
    const order = await ctx.db.get(orderId);
    if (!order) throw new ConvexError("Order not found");
    if (order.customerId !== customerId) throw new ConvexError("Not your order");
    if (order.status !== "delivered") throw new ConvexError("Order must be delivered before reviewing");

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .first();
    if (existing) throw new ConvexError("Order already reviewed");

    const id = await ctx.db.insert("reviews", { orderId, customerId, rating, comment });
    return ctx.db.get(id);
  },
});

export const getByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    return ctx.db
      .query("reviews")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .first();
  },
});
