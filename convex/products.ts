import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    category: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, { activeOnly, category, inStock }) => {
    let products = await ctx.db.query("products").collect();

    if (activeOnly) {
      products = products.filter((p) => p.isActive);
    }
    if (category) {
      products = products.filter((p) => p.category === category);
    }
    if (inStock) {
      products = products.filter((p) => p.stockQuantity > 0);
    }

    return products;
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    description: v.optional(v.string()),
    packSize: v.string(),
    priceKes: v.number(),
    stockQuantity: v.number(),
    imageUrl: v.optional(v.string()),
    isActive: v.boolean(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .first();
    if (existing) {
      throw new ConvexError(`SKU ${args.sku} already exists`);
    }
    const id = await ctx.db.insert("products", args);
    return ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    packSize: v.optional(v.string()),
    priceKes: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new ConvexError("Product not found");
    // Remove undefined values
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(id, cleanPatch);
    return ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new ConvexError("Product not found");
    await ctx.db.delete(id);
  },
});
