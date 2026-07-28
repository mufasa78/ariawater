import { query } from "./_generated/server";
import { v } from "convex/values";
const DAY_MS = 86400000;
export const summary = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const startOfToday = now - (now % DAY_MS);
        const startOfWeek = startOfToday - 6 * DAY_MS;
        const allOrders = await ctx.db.query("orders").collect();
        const allProducts = await ctx.db.query("products").collect();
        let todayRevenue = 0, todayOrders = 0;
        let weekRevenue = 0, weekOrders = 0;
        let totalRevenue = 0, totalOrders = 0;
        const ordersByStatus = { received: 0, processing: 0, dispatched: 0, delivered: 0 };
        for (const order of allOrders) {
            const created = order._creationTime;
            totalRevenue += order.totalKes;
            totalOrders += 1;
            if (created >= startOfToday) {
                todayRevenue += order.totalKes;
                todayOrders += 1;
            }
            if (created >= startOfWeek) {
                weekRevenue += order.totalKes;
                weekOrders += 1;
            }
            if (order.status in ordersByStatus) {
                ordersByStatus[order.status] += 1;
            }
        }
        const lowStockProducts = allProducts.filter((p) => p.isActive && p.stockQuantity <= 10).length;
        return {
            todayRevenue,
            todayOrders,
            weekRevenue,
            weekOrders,
            totalRevenue,
            totalOrders,
            ordersByStatus,
            lowStockProducts,
        };
    },
});
export const recentOrders = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, { limit = 10 }) => {
        const orders = await ctx.db
            .query("orders")
            .order("desc")
            .take(limit);
        return Promise.all(orders.map(async (order) => {
            const customer = await ctx.db.get(order.customerId);
            const items = await ctx.db
                .query("orderItems")
                .withIndex("by_order", (q) => q.eq("orderId", order._id))
                .collect();
            return {
                id: order._id,
                customerName: customer?.name ?? "Unknown",
                customerEmail: customer?.email ?? null,
                totalKes: order.totalKes,
                status: order.status,
                paymentStatus: order.paymentStatus,
                createdAt: new Date(order._creationTime).toISOString(),
                itemCount: items.length,
            };
        }));
    },
});
export const revenueTrend = query({
    args: { days: v.optional(v.number()) },
    handler: async (ctx, { days = 30 }) => {
        const now = Date.now();
        const startOfToday = now - (now % DAY_MS);
        const startDate = startOfToday - (days - 1) * DAY_MS;
        const orders = await ctx.db.query("orders").collect();
        const filtered = orders.filter((o) => o._creationTime >= startDate);
        // Group by date
        const byDay = new Map();
        // Populate all days with 0
        for (let d = 0; d < days; d++) {
            const ts = startDate + d * DAY_MS;
            const dateStr = new Date(ts).toISOString().slice(0, 10);
            byDay.set(dateStr, { revenue: 0, orders: 0 });
        }
        for (const order of filtered) {
            const dateStr = new Date(order._creationTime).toISOString().slice(0, 10);
            const current = byDay.get(dateStr) ?? { revenue: 0, orders: 0 };
            current.revenue += order.totalKes;
            current.orders += 1;
            byDay.set(dateStr, current);
        }
        return Array.from(byDay.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({ date, ...data }));
    },
});
