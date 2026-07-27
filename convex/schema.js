import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        passwordHash: v.string(),
        role: v.union(v.literal("admin"), v.literal("marketing"), v.literal("sales"), v.literal("accounting"), v.literal("customer")),
        approved: v.boolean(), // requires admin approval before login
    }).index("by_email", ["email"]),
    products: defineTable({
        name: v.string(),
        sku: v.string(),
        description: v.optional(v.string()),
        packSize: v.string(),
        priceKes: v.number(),
        stockQuantity: v.number(),
        imageUrl: v.optional(v.string()),
        isActive: v.boolean(),
        category: v.optional(v.string()),
        // KRA compliance fields
        vatClass: v.optional(v.union(v.literal("standard"), v.literal("zero"), v.literal("exempt"))),
        kraItemCode: v.optional(v.string()),
        uom: v.optional(v.string()), // unit of measure: piece, carton, litre, kg, unit
    })
        .index("by_sku", ["sku"])
        .index("by_active", ["isActive"]),
    orders: defineTable({
        customerId: v.optional(v.id("users")), // Optional for guest orders
        customerName: v.optional(v.string()), // Guest customer name
        customerEmail: v.optional(v.string()), // Guest customer email
        status: v.union(v.literal("received"), v.literal("processing"), v.literal("dispatched"), v.literal("delivered")),
        totalKes: v.number(),
        deliveryAddress: v.string(),
        phone: v.string(),
        notes: v.optional(v.string()),
        paymentMethod: v.optional(v.string()),
        paymentStatus: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
        paystackRef: v.optional(v.string()),
        updatedAt: v.number(),
    })
        .index("by_customer", ["customerId"])
        .index("by_status", ["status"])
        .index("by_paystackRef", ["paystackRef"]),
    orderItems: defineTable({
        orderId: v.id("orders"),
        productId: v.id("products"),
        quantity: v.number(),
        unitPriceKes: v.number(),
    }).index("by_order", ["orderId"]),
    reviews: defineTable({
        orderId: v.id("orders"),
        customerId: v.id("users"),
        rating: v.number(),
        comment: v.optional(v.string()),
    })
        .index("by_order", ["orderId"])
        .index("by_customer", ["customerId"]),
    magicLinkTokens: defineTable({
        email: v.string(),
        token: v.string(),
        expiresAt: v.number(),
        used: v.boolean(),
    })
        .index("by_token", ["token"])
        .index("by_email", ["email"])
        .index("by_expiresAt", ["expiresAt"]),
});
