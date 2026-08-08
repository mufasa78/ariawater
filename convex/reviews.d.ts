export declare const create: import("convex/server").RegisteredMutation<"public", {
    comment?: string;
    customerId: string;
    orderId: import("convex/values").GenericId<"orders">;
    rating: number;
}, Promise<{
    _id: import("convex/values").GenericId<"reviews">;
    _creationTime: number;
    comment?: string;
    customerId: string;
    orderId: import("convex/values").GenericId<"orders">;
    rating: number;
}>>;
export declare const getByOrder: import("convex/server").RegisteredQuery<"public", {
    orderId: import("convex/values").GenericId<"orders">;
}, Promise<{
    _id: import("convex/values").GenericId<"reviews">;
    _creationTime: number;
    comment?: string;
    customerId: string;
    orderId: import("convex/values").GenericId<"orders">;
    rating: number;
}>>;
