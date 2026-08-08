export declare const getByOrder: import("convex/server").RegisteredQuery<"public", {
    orderId: import("convex/values").GenericId<"orders">;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
export declare const getByProviderTransactionId: import("convex/server").RegisteredQuery<"public", {
    providerTransactionId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
export declare const getById: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"payments">;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
export declare const create: import("convex/server").RegisteredMutation<"public", {
    phone: string;
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
export declare const updateProviderTransactionId: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"payments">;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    providerTransactionId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
export declare const markSuccessful: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"payments">;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
export declare const markFailed: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"payments">;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
export declare const markCancelled: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"payments">;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
export declare const markExpired: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"payments">;
}, Promise<{
    _id: import("convex/values").GenericId<"payments">;
    _creationTime: number;
    providerTransactionId?: string;
    completedAt?: number;
    phone: string;
    status: "pending" | "failed" | "initiated" | "successful" | "cancelled" | "expired";
    orderId: import("convex/values").GenericId<"orders">;
    provider: string;
    amount: number;
    createdAt: number;
}>>;
