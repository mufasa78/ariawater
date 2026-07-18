/** Returns a one-time URL the client can POST a file to. */
export declare const generateUploadUrl: import("convex/server").RegisteredMutation<"public", import("convex/dist/cjs-types/server/registration").EmptyObject, Promise<string>>;
/** Resolves a storage ID to its public CDN URL. */
export declare const getStorageUrl: import("convex/server").RegisteredQuery<"public", {
    storageId: string;
}, Promise<string>>;
//# sourceMappingURL=files.d.ts.map