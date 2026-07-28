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
        role: v.union(v.literal("admin"), v.literal("marketing"), v.literal("sales"), v.literal("accounting"), v.literal("customer")),
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
        role: v.optional(v.union(v.literal("admin"), v.literal("marketing"), v.literal("sales"), v.literal("accounting"), v.literal("customer"))),
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
