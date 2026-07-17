/**
 * Type stub for convex/_generated/api.
 *
 * Exists only to give TypeScript a resolvable type for the convex api import
 * without forcing it to follow the full convex source chain (dashboard.ts,
 * orders.ts, etc. import from convex/values and convex/server which are not
 * resolvable in this tsconfig context).
 *
 * At build time, esbuild resolves imports using the real file path and ignores
 * tsconfig paths, so the actual convex generated api is bundled correctly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api: Record<string, any> = {};
