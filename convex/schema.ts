import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    passwordHash: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("marketing"),
      v.literal("sales"),
      v.literal("accounting"),
      v.literal("customer")
    ),
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
    customerId: v.optional(v.string()), // Optional for guest orders (supports Clerk strings and old Convex IDs)
    customerName: v.optional(v.string()), // Guest customer name
    customerEmail: v.optional(v.string()), // Guest customer email
    orderNumber: v.optional(v.string()), // Human-readable order number, e.g. ARI-20260808-001
    status: v.union(
      v.literal("received"),
      v.literal("processing"),
      v.literal("dispatched"),
      v.literal("delivered"),
    ),
    totalKes: v.number(),
    deliveryAddress: v.string(),
    phone: v.string(),
    notes: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    paystackRef: v.optional(v.string()),
    ticketNumber: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_paystackRef", ["paystackRef"])
    .index("by_ticketNumber", ["ticketNumber"])
    .index("by_orderNumber", ["orderNumber"]),

  payments: defineTable({
    orderId: v.id("orders"),
    provider: v.string(), // "lipana", "paystack"
    providerTransactionId: v.optional(v.string()), // Lipana transactionId or Paystack reference
    amount: v.number(),
    phone: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("initiated"),
      v.literal("successful"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_order", ["orderId"])
    .index("by_provider_transaction", ["providerTransactionId"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    quantity: v.number(),
    unitPriceKes: v.number(),
  }).index("by_order", ["orderId"]),

  reviews: defineTable({
    orderId: v.id("orders"),
    customerId: v.string(), // supports Clerk strings and old Convex IDs
    rating: v.number(),
    comment: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_customer", ["customerId"]),

  payments: defineTable({
    orderId: v.id("orders"),
    provider: v.literal("lipana"),
    providerTransactionId: v.optional(v.string()),
    amount: v.number(),
    phone: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("initiated"),
      v.literal("successful"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    providerReference: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_order", ["orderId"])
    .index("by_provider_transaction", ["providerTransactionId"]),

  magicLinkTokens: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_expiresAt", ["expiresAt"]),

  tickets: defineTable({
    orderId: v.id("orders"),
    ticketNumber: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("closed")),
    messages: v.array(
      v.object({
        sender: v.union(v.literal("customer"), v.literal("support"), v.literal("system")),
        text: v.string(),
        timestamp: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_order", ["orderId"])
    .index("by_ticketNumber", ["ticketNumber"])
    .index("by_status", ["status"]),
});
