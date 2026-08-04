import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
/** Returns a one-time URL the client can POST a file to. */
export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return ctx.storage.generateUploadUrl();
    },
});
/** Resolves a storage ID to its public CDN URL. */
export const getStorageUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, { storageId }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ctx.storage.getUrl(storageId);
    },
});
