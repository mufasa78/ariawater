import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { GetTrackInfoResponse, ErrorResponse } from "@workspace/api-zod";

const router: Router = Router();

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
    ticketNumber: o.ticketNumber ?? null,
    createdAt: new Date(o._creationTime as number).toISOString(),
    updatedAt: new Date((o.updatedAt as number) ?? (o._creationTime as number)).toISOString(),
    items: (o.items as unknown[] | undefined)?.map(mapOrderItem) ?? undefined,
    review: (o.review as Record<string, unknown> | null | undefined) ? mapReview(o.review as Record<string, unknown>) : undefined,
    itemCount: o.itemCount,
  };
}

// GET /api/tickets/:ticketNumber/track
router.get("/:ticketNumber/track", async (req, res) => {
  const { ticketNumber } = req.params;

  const data = await convex.query(api.tickets.getTrackInfo, { ticketNumber }) as Record<string, unknown> | null;

  if (!data) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(GetTrackInfoResponse.parse({
    ticket: data.ticket,
    order: mapOrder(data.order as Record<string, unknown>)
  }));
});

export default router;
