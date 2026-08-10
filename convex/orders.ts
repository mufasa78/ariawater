import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listByCustomer = query({
  args: {
    customerId: v.string(), // supports both Clerk strings and old Convex IDs
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { customerId, page = 1, limit = 20 }) => {
    // Use .take() instead of .collect() to bound the query
    // For total count, we'll need to count separately or estimate
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId as any))
      .order("desc")
      .take(limit * page); // Fetch up to the current page

    const total = orders.length; // Approximate total (will be exact if < limit * page)
    const offset = (page - 1) * limit;
    const pageOrders = orders.slice(offset, offset + limit);

    return { orders: pageOrders, total, page, limit };
  },
});

export const listAll = query({
  args: {
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, page = 1, limit = 50 }) => {
    // Calculate how many we need to fetch to satisfy pagination
    const maxToFetch = page * limit + 100; // Buffer for filtering
    
    let orders;
    if (status) {
      // If filtering by status, use index if available, otherwise scan bounded set
      orders = await ctx.db
        .query("orders")
        .order("desc")
        .take(maxToFetch);
      orders = orders.filter((o) => o.status === status);
    } else {
      orders = await ctx.db
        .query("orders")
        .order("desc")
        .take(maxToFetch);
    }

    const total = orders.length; // Approximate (exact if < maxToFetch)
    const offset = (page - 1) * limit;
    const pageOrders = orders.slice(offset, offset + limit);

    // Attach customer info
    const enriched = await Promise.all(
      pageOrders.map(async (order) => {
        let customerName = order.customerName ?? null;
        let customerEmail = order.customerEmail ?? null;
        
        // If customerId exists and is a valid users table ID, fetch customer details
        if (order.customerId) {
          const userId = ctx.db.normalizeId("users", order.customerId);
          if (userId) {
            const customer = await ctx.db.get(userId);
            if (customer) {
              customerName = customer.name;
              customerEmail = customer.email;
            }
          }
        }
        
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .take(10); // Bound item fetch
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
    
    // If customerId exists and is a valid users table ID, fetch customer details
    if (order.customerId) {
      const userId = ctx.db.normalizeId("users", order.customerId);
      if (userId) {
        const customer = await ctx.db.get(userId);
        if (customer) {
          customerName = customer.name;
          customerEmail = customer.email;
        }
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
    customerId: v.optional(v.string()), // Optional for guest orders (supports Clerk strings and old Convex IDs)
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
    
    // Generate order number for tracking (ARI-YYYYMMDD-XXXX)
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ARI-${datePrefix}-${randomSuffix}`;
    
    // Generate ticket number for support tracking
    const ticketNumber = `AW-${datePrefix}-${randomSuffix}`;
    
    const orderId = await ctx.db.insert("orders", {
      customerId,
      customerName,
      customerEmail,
      orderNumber,
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
    
    const now = Date.now();
    
    // Update order status
    await ctx.db.patch(id, { status, updatedAt: now });
    
    // Update associated ticket with status change message
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_order", (q) => q.eq("orderId", id))
      .first();
    
    if (ticket) {
      const statusMessages: Record<string, string> = {
        received: "Your order has been received and is being prepared for processing.",
        processing: "Your order is now being processed and will be dispatched soon.",
        dispatched: "Your order has been dispatched and is on its way to you!",
        delivered: "Your order has been delivered. Thank you for choosing Ari Water!"
      };
      
      await ctx.db.patch(ticket._id, {
        messages: [
          ...ticket.messages,
          {
            sender: "system" as const,
            text: statusMessages[status] || `Order status updated to ${status}`,
            timestamp: now
          }
        ],
        updatedAt: now,
        // Auto-resolve ticket when order is delivered
        ...(status === "delivered" ? { status: "resolved" as const } : {})
      });
    }
    
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
    customerId: v.optional(v.string()),
  },
  handler: async (ctx, { reference, customerId }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_paystackRef", (q) => q.eq("paystackRef", reference))
      .first();
    if (!order) return null;
    if (customerId && order.customerId && order.customerId !== customerId) return null;
    return order;
  },
});

// Utility mutation to create tickets for orders that don't have them (migration/repair)
export const createMissingTickets = mutation({
  args: {},
  handler: async (ctx, {}) => {
    const orders = await ctx.db.query("orders").take(1000);
    let created = 0;
    let skipped = 0;
    
    for (const order of orders) {
      // Check if ticket already exists
      const existingTicket = await ctx.db
        .query("tickets")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .first();
      
      if (!existingTicket) {
        // Check if order has a ticket number, if not generate one
        let ticketNumber = order.ticketNumber;
        if (!ticketNumber) {
          const datePrefix = new Date(order._creationTime).toISOString().slice(2, 10).replace(/-/g, "");
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          ticketNumber = `AW-${datePrefix}-${randomSuffix}`;
          
          // Update order with ticket number
          await ctx.db.patch(order._id, { ticketNumber });
        }
        
        // Create ticket
        await ctx.db.insert("tickets", {
          orderId: order._id,
          ticketNumber,
          status: order.status === "delivered" ? "resolved" : "open",
          messages: [{
            sender: "system" as const,
            text: `Ticket created for order tracking. Current order status: ${order.status}`,
            timestamp: Date.now()
          }],
          createdAt: order._creationTime,
          updatedAt: Date.now(),
        });
        
        created++;
      } else {
        skipped++;
      }
    }
    
    return { created, skipped, total: orders.length };
  },
});

// Debug query to check all orders and their tickets
export const debugOrdersAndTickets = query({
  args: {},
  handler: async (ctx, {}) => {
    const orders = await ctx.db.query("orders").take(10);
    const results = await Promise.all(
      orders.map(async (order) => {
        const ticket = await ctx.db
          .query("tickets")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .first();
        
        return {
          orderId: order._id,
          orderTicketNumber: order.ticketNumber,
          hasTicket: !!ticket,
          ticketNumber: ticket?.ticketNumber,
          ticketStatus: ticket?.status,
        };
      })
    );
    
    return results;
  },
});
