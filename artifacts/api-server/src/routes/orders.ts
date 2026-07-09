import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, usersTable, reviewsTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  CreateReviewParams,
  CreateReviewBody,
  ListOrdersResponse,
  CreateOrderResponse,
  GetOrderResponse,
  UpdateOrderStatusResponse,
  CreateReviewResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function mapOrder(o: typeof ordersTable.$inferSelect, customerName?: string | null, customerEmail?: string | null) {
  return {
    id: o.id,
    customerId: o.customerId,
    customerName: customerName ?? null,
    customerEmail: customerEmail ?? null,
    status: o.status,
    totalKes: Number(o.totalKes),
    deliveryAddress: o.deliveryAddress,
    phone: o.phone,
    notes: o.notes ?? null,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod ?? null,
    paystackRef: o.paystackRef ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const isAdmin = req.session.userRole === "admin";
  const page = params.data.page ?? 1;
  const limit = params.data.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (!isAdmin) {
    conditions.push(eq(ordersTable.customerId, req.session.userId!));
  }
  if (params.data.status) {
    conditions.push(eq(ordersTable.status, params.data.status));
  }

  const query = db
    .select({
      order: ordersTable,
      customerName: usersTable.name,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.customerId, usersTable.id))
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const rows = await query;
  const orders = rows.map((r) => ({
    ...mapOrder(r.order, r.customerName),
  }));

  // Count total
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(ordersTable);
  if (conditions.length > 0) {
    countQuery.where(and(...conditions));
  }
  const [{ count }] = await countQuery;

  res.json(ListOrdersResponse.parse({ orders, total: Number(count), page, limit }));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { deliveryAddress, phone, notes, paymentMethod, items } = parsed.data;

  // Run everything inside a single transaction with FOR UPDATE locks on products
  let createdOrder: typeof ordersTable.$inferSelect;

  try {
    createdOrder = await db.transaction(async (tx) => {
      let totalKes = 0;
      const resolvedItems: { productId: number; quantity: number; unitPriceKes: number }[] = [];

      for (const item of items) {
        // Lock the product row to prevent concurrent oversell
        const [product] = await tx
          .select()
          .from(productsTable)
          .where(and(eq(productsTable.id, item.productId), eq(productsTable.isActive, true)))
          .for("update");

        if (!product) {
          throw Object.assign(new Error(`Product ${item.productId} not found or inactive`), { statusCode: 400 });
        }

        if (product.stockQuantity < item.quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { statusCode: 400 });
        }

        const unitPrice = Number(product.priceKes);
        totalKes += unitPrice * item.quantity;
        resolvedItems.push({ productId: item.productId, quantity: item.quantity, unitPriceKes: unitPrice });
      }

      // Insert order
      const [order] = await tx
        .insert(ordersTable)
        .values({
          customerId: req.session.userId!,
          status: "received",
          totalKes: String(totalKes),
          deliveryAddress,
          phone,
          notes: notes ?? null,
          paymentMethod: paymentMethod ?? null,
          paymentStatus: "pending",
        })
        .returning();

      // Insert order items and atomically decrement stock
      for (const item of resolvedItems) {
        await tx.insert(orderItemsTable).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPriceKes: String(item.unitPriceKes),
        });

        await tx
          .update(productsTable)
          .set({ stockQuantity: sql`${productsTable.stockQuantity} - ${item.quantity}` })
          .where(eq(productsTable.id, item.productId));
      }

      return order;
    });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode) {
      res.status(e.statusCode).json({ error: e.message });
      return;
    }
    throw err;
  }

  res.status(201).json(CreateOrderResponse.parse(mapOrder(createdOrder)));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const isAdmin = req.session.userRole === "admin";
  const conditions = [eq(ordersTable.id, params.data.id)];
  if (!isAdmin) {
    conditions.push(eq(ordersTable.customerId, req.session.userId!));
  }

  const [row] = await db
    .select({ order: ordersTable, customerName: usersTable.name, customerEmail: usersTable.email })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.customerId, usersTable.id))
    .where(and(...conditions));

  if (!row) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Get order items
  const itemRows = await db
    .select({ item: orderItemsTable, product: productsTable })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, row.order.id));

  const items = itemRows.map((r) => ({
    id: r.item.id,
    productId: r.item.productId,
    productName: r.product?.name ?? "Unknown",
    packSize: r.product?.packSize ?? "",
    quantity: r.item.quantity,
    unitPriceKes: Number(r.item.unitPriceKes),
  }));

  // Get review if exists
  const [review] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.orderId, row.order.id));

  const mappedReview = review
    ? {
        id: review.id,
        orderId: review.orderId,
        customerId: review.customerId,
        rating: review.rating,
        remark: review.remark ?? null,
        createdAt: review.createdAt.toISOString(),
      }
    : undefined;

  res.json(
    GetOrderResponse.parse({
      ...mapOrder(row.order, row.customerName, row.customerEmail),
      items,
      review: mappedReview,
    })
  );
});

router.patch("/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(UpdateOrderStatusResponse.parse(mapOrder(order)));
});

router.post("/orders/:id/review", requireAuth, async (req, res): Promise<void> => {
  const params = CreateReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Verify the order belongs to the customer and is delivered
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.customerId, req.session.userId!)));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.status !== "delivered") {
    res.status(400).json({ error: "Can only review delivered orders" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      orderId: params.data.id,
      customerId: req.session.userId!,
      rating: parsed.data.rating,
      remark: parsed.data.remark ?? null,
    })
    .returning();

  res.status(201).json(
    CreateReviewResponse.parse({
      id: review.id,
      orderId: review.orderId,
      customerId: review.customerId,
      rating: review.rating,
      remark: review.remark ?? null,
      createdAt: review.createdAt.toISOString(),
    })
  );
});

export default router;
