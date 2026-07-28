import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
// Magic link tokens expire after 15 minutes
const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds
/**
 * Generate a magic link token for passwordless authentication
 */
export const generateMagicLink = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, { email, name, phone }) => {
        // Generate a random token
        const token = generateRandomToken();
        const expiresAt = Date.now() + MAGIC_LINK_EXPIRY;
        // Check if user exists
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();
        // If user doesn't exist, create them (auto-approved for magic link users)
        if (!user) {
            const userId = await ctx.db.insert("users", {
                email,
                name: name || email.split("@")[0],
                phone: phone || undefined,
                passwordHash: "", // No password for magic link users
                role: "customer",
                approved: true, // Auto-approve magic link users
            });
            user = await ctx.db.get(userId);
        }
        // Store the magic link token
        await ctx.db.insert("magicLinkTokens", {
            email,
            token,
            expiresAt,
            used: false,
        });
        return {
            token,
            expiresAt,
            userId: user._id,
        };
    },
});
/**
 * Verify and consume a magic link token
 */
export const verifyMagicLink = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, { token }) => {
        // Find the token
        const magicLink = await ctx.db
            .query("magicLinkTokens")
            .withIndex("by_token", (q) => q.eq("token", token))
            .first();
        if (!magicLink) {
            throw new ConvexError("Invalid magic link");
        }
        // Check if token is expired
        if (Date.now() > magicLink.expiresAt) {
            throw new ConvexError("Magic link has expired");
        }
        // Check if token has been used
        if (magicLink.used) {
            throw new ConvexError("Magic link has already been used");
        }
        // Find the user
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", magicLink.email))
            .first();
        if (!user) {
            throw new ConvexError("User not found");
        }
        // Mark token as used
        await ctx.db.patch(magicLink._id, { used: true });
        return {
            userId: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
        };
    },
});
/**
 * Clean up expired magic link tokens (call this periodically)
 */
export const cleanupExpiredTokens = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const expiredTokens = await ctx.db
            .query("magicLinkTokens")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();
        for (const token of expiredTokens) {
            await ctx.db.delete(token._id);
        }
        return { deleted: expiredTokens.length };
    },
});
/**
 * Check if a token is valid (without consuming it)
 */
export const checkMagicLink = query({
    args: {
        token: v.string(),
    },
    handler: async (ctx, { token }) => {
        const magicLink = await ctx.db
            .query("magicLinkTokens")
            .withIndex("by_token", (q) => q.eq("token", token))
            .first();
        if (!magicLink) {
            return { valid: false, reason: "Token not found" };
        }
        if (Date.now() > magicLink.expiresAt) {
            return { valid: false, reason: "Token expired" };
        }
        if (magicLink.used) {
            return { valid: false, reason: "Token already used" };
        }
        return { valid: true, email: magicLink.email };
    },
});
// Helper function to generate a random token
function generateRandomToken() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
