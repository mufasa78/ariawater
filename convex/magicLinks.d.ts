/**
 * Generate a magic link token for passwordless authentication
 */
export declare const generateMagicLink: import("convex/server").RegisteredMutation<"public", {
    name?: string;
    phone?: string;
    email: string;
}, Promise<{
    token: string;
    expiresAt: number;
    userId: import("convex/values").GenericId<"users">;
}>>;
/**
 * Verify and consume a magic link token
 */
export declare const verifyMagicLink: import("convex/server").RegisteredMutation<"public", {
    token: string;
}, Promise<{
    userId: import("convex/values").GenericId<"users">;
    email: string;
    name: string;
    role: "admin" | "marketing" | "sales" | "accounting" | "customer";
    phone: string;
}>>;
/**
 * Clean up expired magic link tokens (call this periodically)
 */
export declare const cleanupExpiredTokens: import("convex/server").RegisteredMutation<"public", {}, Promise<{
    deleted: number;
}>>;
/**
 * Check if a token is valid (without consuming it)
 */
export declare const checkMagicLink: import("convex/server").RegisteredQuery<"public", {
    token: string;
}, Promise<{
    valid: boolean;
    reason: string;
    email?: undefined;
} | {
    valid: boolean;
    email: string;
    reason?: undefined;
}>>;
