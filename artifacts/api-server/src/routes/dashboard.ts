import { Router, type IRouter } from "express";
import { sql, lt } from "drizzle-orm";
import { db, ordersTable, productsTable, usersTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentOrdersResponse,
  GetRevenueTrendResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAdmin, async (req, res): Promise<void> => {
  // Today's revenue and order count
  const [today] = await db
    .select({
      revenue: sql<number>`coalesce(sum(total_kes::numeric), 0)`,
      orders: sql<number>`count(*)`,
    })
    .from(ordersTable)
    .where(sql`date_trunc('day', created_at) = date_trunc('day', now())`);

  // This week's revenue and order count
  const [week] = await db
    .select({
      revenue: sql<number>`coalesce(sum(total_kes::numeric), 0)`,
      orders: sql<number>`count(*)`,
    })
    .from(ordersTable)
    .where(sql`date_trunc('week', created_at) = date_trunc('week', now())`);

  // All-time totals
  const [total] = await db
    .select({
      revenue: sql<number>`coalesce(sum(total_kes::numeric), 0)`,
      orders: sql<number>`count(*)`,
    })
    .from(ordersTable);

  // Orders by status
  const statusRows = await db
    .select({
      status: ordersTable.status,
      count: sql<number>`count(*)`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  const ordersByStatus = { received: 0, processing: 0, dispatched: 0, delivered: 0 };
  for (const row of statusRows) {
    if (row.status in ordersByStatus) {
      ordersByStatus[row.status as keyof typeof ordersByStatus] = Number(row.count);
    }
  }

  // Low stock products (quantity < 10)
  const [{ lowStock }] = await db
    .select({ lowStock: sql<number>`count(*)` })
    .from(productsTable)
    .where(lt(productsTable.stockQuantity, 10));

  res.json(
    GetDashboardSummaryResponse.parse({
      todayRevenue: Number(today.revenue),
      todayOrders: Number(today.orders),
      weekRevenue: Number(week.revenue),
      weekOrders: Number(week.orders),
      totalRevenue: Number(total.revenue),
      totalOrders: Number(total.orders),
      ordersByStatus,
      lowStockProducts: Number(lowStock),
    })
  );
});

router.get("/dashboard/recent-orders", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: ordersTable.id,
      customerName: usersTable.name,
      customerEmail: usersTable.email,
      totalKes: ordersTable.totalKes,
      status: ordersTable.status,
      paymentStatus: ordersTable.paymentStatus,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .leftJoin(usersTable, sql`${ordersTable.customerId} = ${usersTable.id}`)
    .orderBy(sql`${ordersTable.createdAt} desc`)
    .limit(10);

  // Get item counts per order
  const orderIds = rows.map((r) => r.id);
  let itemCounts: Record<number, number> = {};

  if (orderIds.length > 0) {
    const countRows = await db
      .select({
        orderId: sql<number>`order_id`,
        count: sql<number>`count(*)`,
      })
      .from(sql`order_items`)
      .where(sql`order_id = any(array[${sql.join(orderIds.map((id) => sql`${id}`), sql`, `)}]::int[])`)
      .groupBy(sql`order_id`);
    for (const r of countRows) {
      itemCounts[r.orderId] = Number(r.count);
    }
  }

  const result = rows.map((r) => ({
    id: r.id,
    customerName: r.customerName ?? "Unknown",
    customerEmail: r.customerEmail ?? null,
    totalKes: Number(r.totalKes),
    status: r.status,
    paymentStatus: r.paymentStatus,
    createdAt: r.createdAt.toISOString(),
    itemCount: itemCounts[r.id] ?? 0,
  }));

  res.json(GetRecentOrdersResponse.parse(result));
});

router.get("/dashboard/revenue-trend", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', created_at), 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(total_kes::numeric), 0)`,
      orders: sql<number>`count(*)`,
    })
    .from(ordersTable)
    .where(sql`created_at >= now() - interval '30 days'`)
    .groupBy(sql`date_trunc('day', created_at)`)
    .orderBy(sql`date_trunc('day', created_at)`);

  res.json(
    GetRevenueTrendResponse.parse(
      rows.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      }))
    )
  );
});

export default router;
