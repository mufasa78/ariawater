import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { requireAuth, requireAdmin, requireRole } from "../middlewares/auth.js";
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

const router: Router = Router();

function mapOrder(o: Record<string, unknown>) {
  return {
    id: o._id,
    customerId: o.customerId,
    customerName: o.customerName ?? null,
    customerEmail: o.customerEmail ?? null,
    status: o.status,
    totalKes: o.totalKes,
    deliveryAddress: o.deliveryAddress,
    phone: o.phone,
    notes: o.notes ?? null,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod ?? null,
    paystackRef: o.paystackRef ?? null,
    createdAt: new Date(o._creationTime as number).toISOString(),
    updatedAt: new Date((o.updatedAt as number) ?? (o._creationTime as number)).toISOString(),
    items: (o.items as unknown[] | undefined)?.map(mapOrderItem) ?? undefined,
    review: (o.review as Record<string, unknown> | null | undefined) ? mapReview(o.review as Record<string, unknown>) : undefined,
    itemCount: o.itemCount,
  };
}

function mapOrderItem(i: unknown) {
  const item = i as Record<string, unknown>;
  return {
    id: item._id,
    orderId: item.orderId,
    productId: item.productId,
    productName: item.productName ?? null,
    productSku: item.productSku ?? null,
    packSize: item.packSize ?? null,
    imageUrl: item.imageUrl ?? null,
    quantity: item.quantity,
    unitPriceKes: item.unitPriceKes,
  };
}

function mapReview(r: Record<string, unknown>) {
  return {
    id: r._id,
    orderId: r.orderId,
    customerId: r.customerId,
    rating: r.rating,
    remark: r.comment ?? null,
    createdAt: new Date(r._creationTime as number).toISOString(),
  };
}

// GET /api/orders — customer sees own, admin sees all (requires auth)
router.get("/", requireAuth, async (req, res) => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page, limit, status } = params.data;
  const isAdmin = req.user!.role === "admin";

  let result: Record<string, unknown>;

  if (isAdmin) {
    result = await convex.query(api.orders.listAll, {
      status: status ?? undefined,
      page: page ?? 1,
      limit: limit ?? 50,
    }) as Record<string, unknown>;
  } else {
    // Only authenticated customers can list their orders
    if (!req.user!.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    result = await convex.query(api.orders.listByCustomer, {
      customerId: req.user!.userId as any,
      page: page ?? 1,
      limit: limit ?? 20,
    }) as Record<string, unknown>;
  }

  const { orders, total } = result as { orders: Record<string, unknown>[], total: number };

  res.json(
    ListOrdersResponse.parse({
      orders: orders.map(mapOrder),
      total,
      page: page ?? 1,
      limit: isAdmin ? (limit ?? 50) : (limit ?? 20),
    }),
  );
});

// POST /api/orders - Support both authenticated and guest checkout
router.post("/", async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check if user is authenticated
  const isAuthenticated = req.user !== undefined;
  const customerId = isAuthenticated ? req.user!.userId as any : undefined;
  const customerName = isAuthenticated ? req.user!.name : parsed.data.customerName;
  const customerEmail = isAuthenticated ? req.user!.email : parsed.data.customerEmail;

  // For guest checkout, require customerName and customerEmail
  if (!isAuthenticated && (!customerName || !customerEmail)) {
    res.status(400).json({ error: "customerName and customerEmail are required for guest checkout" });
    return;
  }

  let order: Record<string, unknown>;
  try {
    order = await convex.mutation(api.orders.create, {
      customerId,
      customerName,
      customerEmail,
      deliveryAddress: parsed.data.deliveryAddress,
      phone: parsed.data.phone,
      notes: parsed.data.notes ?? undefined,
      paymentMethod: parsed.data.paymentMethod ?? undefined,
      items: parsed.data.items.map((item) => ({
        productId: item.productId as any,
        quantity: item.quantity,
      })),
    }) as Record<string, unknown>;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Insufficient stock") || msg.includes("not found")) {
      res.status(400).json({ error: msg });
      return;
    }
    throw err;
  }

  res.status(201).json(CreateOrderResponse.parse(mapOrder(order)));
});

// GET /api/orders/:id
router.get("/:id", requireAuth, async (req, res) => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await convex.query(api.orders.get, {
    id: params.data.id as any,
  }) as Record<string, unknown> | null;

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Customers can only see their own orders
  if (req.user!.role !== "admin" && order.customerId !== req.user!.userId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json(GetOrderResponse.parse(mapOrder(order)));
});

// PATCH /api/orders/:id/status — admin only
router.patch("/:id/status", requireAdmin, async (req, res) => {
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

  let order: Record<string, unknown> | null;
  try {
    order = await convex.mutation(api.orders.updateStatus, {
      id: params.data.id as any,
      status: parsed.data.status,
    }) as Record<string, unknown> | null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found")) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    throw err;
  }

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(UpdateOrderStatusResponse.parse(mapOrder(order)));
});

// POST /api/orders/:id/review
router.post("/:id/review", requireAuth, async (req, res) => {
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

  let review: Record<string, unknown> | null;
  try {
    review = await convex.mutation(api.reviews.create, {
      orderId: params.data.id as any,
      customerId: req.user!.userId as any,
      rating: parsed.data.rating,
      comment: parsed.data.remark ?? undefined,
    }) as Record<string, unknown> | null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found")) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (msg.includes("Not your order") || msg.includes("must be delivered") || msg.includes("already reviewed")) {
      res.status(400).json({ error: msg });
      return;
    }
    throw err;
  }

  if (!review) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.status(201).json(CreateReviewResponse.parse(mapReview(review)));
});

export default router;
