export declare const summary: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    todayRevenue: number;
    todayOrders: number;
    weekRevenue: number;
    weekOrders: number;
    totalRevenue: number;
    totalOrders: number;
    ordersByStatus: {
        received: number;
        processing: number;
        dispatched: number;
        delivered: number;
    };
    lowStockProducts: number;
}>>;
export declare const recentOrders: import("convex/server").RegisteredQuery<"public", {
    limit?: number;
}, Promise<{
    id: import("convex/values").GenericId<"orders">;
    customerName: string;
    customerEmail: string;
    totalKes: number;
    status: "received" | "processing" | "dispatched" | "delivered";
    paymentStatus: "pending" | "completed" | "failed";
    createdAt: string;
    itemCount: number;
}[]>>;
export declare const revenueTrend: import("convex/server").RegisteredQuery<"public", {
    days?: number;
}, Promise<{
    revenue: number;
    orders: number;
    date: string;
}[]>>;
//# sourceMappingURL=dashboard.d.ts.map