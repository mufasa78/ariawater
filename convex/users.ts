import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
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
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new ConvexError("Email already registered");
    }
    const id = await ctx.db.insert("users", args);
    return ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("marketing"),
        v.literal("sales"),
        v.literal("accounting"),
        v.literal("customer")
      )
    ),
    approved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    return ctx.db.get(id);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("users").collect();
  },
});

export const approveUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { approved: true });
    return ctx.db.get(userId);
  },
});

// Phone-based customer lookup for guest checkout
export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    // Normalize phone number for comparison (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Try to find user by phone number
    const users = await ctx.db.query("users").collect();
    return users.find(u => {
      if (!u.phone) return false;
      const userPhone = u.phone.replace(/[\s\-\(\)]/g, '');
      return userPhone === normalizedPhone || 
             userPhone === normalizedPhone.replace(/^0/, '254') ||
             normalizedPhone === userPhone.replace(/^0/, '254') ||
             userPhone === `+${normalizedPhone}` ||
             normalizedPhone === `+${userPhone}`;
    }) || null;
  },
});

// Create guest customer by phone for order tracking
export const createGuestByPhone = mutation({
  args: {
    phone: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { phone, name, email }) => {
    // Check if customer already exists
    const existing = await ctx.db
      .query("users")
      .collect()
      .then(users => users.find(u => {
        if (!u.phone) return false;
        const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
        const userPhone = u.phone.replace(/[\s\-\(\)]/g, '');
        return userPhone === normalizedPhone || 
               userPhone === normalizedPhone.replace(/^0/, '254') ||
               normalizedPhone === userPhone.replace(/^0/, '254');
      }));
    
    if (existing) {
      return existing;
    }
    
    // Create guest customer record
    const id = await ctx.db.insert("users", {
      name,
      email,
      phone,
      passwordHash: "", // No password for guests
      role: "customer",
      approved: true, // Auto-approve guest customers
    });
    
    return ctx.db.get(id);
  },
});
