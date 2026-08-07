import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listByCustomer = query({
  args: {
    customerId: v.id("users"),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { customerId, page = 1, limit = 20 }) => {
    const all = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .order("desc")
      .collect();

    const total = all.length;
    const offset = (page - 1) * limit;
    const orders = all.slice(offset, offset + limit);

    return { orders, total, page, limit };
  },
});

export const listAll = query({
  args: {
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, page = 1, limit = 50 }) => {
    let all = await ctx.db.query("orders").order("desc").collect();

    if (status) {
      all = all.filter((o) => o.status === status);
    }

    const total = all.length;
    const offset = (page - 1) * limit;
    const orders = all.slice(offset, offset + limit);

    // Attach customer info
    const enriched = await Promise.all(
      orders.map(async (order) => {
        let customerName = order.customerName ?? null;
        let customerEmail = order.customerEmail ?? null;
        
        // If customerId exists, fetch customer details
        if (order.customerId) {
          const customer = await ctx.db.get(order.customerId);
          if (customer) {
            customerName = customer.name;
            customerEmail = customer.email;
          }
        }
        
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        return {
          ...order,
          customerName,
          customerEmail,
          itemCount: items.length,
        };
      }),
    );

    return { orders: enriched, total, page, limit };
  },
});

export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    const order = await ctx.db.get(id);
    if (!order) return null;

    let customerName = order.customerName ?? null;
    let customerEmail = order.customerEmail ?? null;
    
    // If customerId exists, fetch customer details
    if (order.customerId) {
      const customer = await ctx.db.get(order.customerId);
      if (customer) {
        customerName = customer.name;
        customerEmail = customer.email;
      }
    }

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", id))
      .collect();

    // Enrich items with product info
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          productName: product?.name ?? null,
          productSku: product?.sku ?? null,
          packSize: product?.packSize ?? null,
          imageUrl: product?.imageUrl ?? null,
        };
      }),
    );

    const review = await ctx.db
      .query("reviews")
      .withIndex("by_order", (q) => q.eq("orderId", id))
      .first();

    return {
      ...order,
      customerName,
      customerEmail,
      items: enrichedItems,
      review: review ?? null,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    customerId: v.optional(v.id("users")), // Optional for guest orders
    customerName: v.optional(v.string()), // Guest customer name
    customerEmail: v.optional(v.string()), // Guest customer email
    deliveryAddress: v.string(),
    phone: v.string(),
    notes: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
  },
  handler: async (ctx, { customerId, customerName, customerEmail, deliveryAddress, phone, notes, paymentMethod, items }) => {
    // Validate that either customerId (authenticated) or customerName + customerEmail (guest) is provided
    if (!customerId && (!customerName || !customerEmail)) {
      throw new ConvexError("Either customerId (for authenticated users) or customerName + customerEmail (for guests) is required");
    }

    let totalKes = 0;
    const resolvedItems: {
      productId: Id<"products">;
      quantity: number;
      unitPriceKes: number;
    }[] = [];

    // Validate stock and compute total — all reads see the same snapshot (OCC-safe)
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (!product || !product.isActive) {
        throw new ConvexError(`Product not found or inactive: ${item.productId}`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new ConvexError(`Insufficient stock for ${product.name}`);
      }
      totalKes += product.priceKes * item.quantity;
      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceKes: product.priceKes,
      });
    }

    const now = Date.now();
    
    // Generate a simple ticket number for tracking
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const ticketNumber = `AW-${datePrefix}-${randomSuffix}`;
    
    const orderId = await ctx.db.insert("orders", {
      customerId,
      customerName,
      customerEmail,
      status: "received",
      totalKes,
      deliveryAddress,
      phone,
      notes,
      paymentMethod,
      paymentStatus: "pending",
      ticketNumber,
      updatedAt: now,
    });

    for (const item of resolvedItems) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceKes: item.unitPriceKes,
      });
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          stockQuantity: product.stockQuantity - item.quantity,
        });
      }
    }

    await ctx.db.insert("tickets", {
      orderId,
      ticketNumber,
      status: "open",
      messages: [
        {
          sender: "system",
          text: `Ticket created for order tracking.`,
          timestamp: now,
        }
      ],
      createdAt: now,
      updatedAt: now,
    });

    return ctx.db.get(orderId);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("received"),
      v.literal("processing"),
      v.literal("dispatched"),
      v.literal("delivered"),
    ),
  },
  handler: async (ctx, { id, status }) => {
    const order = await ctx.db.get(id);
    if (!order) throw new ConvexError("Order not found");
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
    return ctx.db.get(id);
  },
});

export const updatePayment = mutation({
  args: {
    id: v.id("orders"),
    paystackRef: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, { id, paystackRef, paymentStatus }) => {
    const order = await ctx.db.get(id);
    if (!order) throw new ConvexError("Order not found");
    const patch: Partial<{ paystackRef: string; paymentStatus: "pending" | "completed" | "failed"; updatedAt: number }> = {
      paymentStatus,
      updatedAt: Date.now(),
    };
    if (paystackRef) patch.paystackRef = paystackRef;
    await ctx.db.patch(id, patch);
    return ctx.db.get(id);
  },
});

export const getByPaystackRef = query({
  args: {
    reference: v.string(),
    customerId: v.optional(v.id("users")),
  },
  handler: async (ctx, { reference, customerId }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_paystackRef", (q) => q.eq("paystackRef", reference))
      .first();
    if (!order) return null;
    if (customerId && order.customerId !== customerId) return null;
    return order;
  },
});
