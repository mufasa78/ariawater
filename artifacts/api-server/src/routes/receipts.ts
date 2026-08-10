import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { optionalAuth } from "../middlewares/auth.js";
import { generateReceiptPDF, type ReceiptData } from "../lib/pdf-receipt.js";

const router: Router = Router();

// GET /api/receipts/:orderId/download - Download order receipt as PDF
router.get("/:orderId/download", optionalAuth, async (req, res) => {
  const { orderId } = req.params;

  try {
    // Fetch order from Convex
    const order = await convex.query(api.orders.get, {
      id: orderId as any,
    }) as Record<string, unknown> | null;

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // For authenticated users, check if they own the order (unless admin)
    if (req.user && req.user.role !== "admin") {
      if (order.customerId !== req.user.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    // Prepare receipt data
    const items = (order.items as any[] || []).map((item: any) => ({
      productName: item.productName || 'Unknown Product',
      packSize: item.packSize || '',
      quantity: item.quantity || 1,
      unitPriceKes: item.unitPriceKes || 0,
      totalKes: (item.quantity || 1) * (item.unitPriceKes || 0),
    }));

    const receiptData: ReceiptData = {
      orderId: order._id as string,
      ticketNumber: (order.ticketNumber as string) || (order._id as string).slice(0, 10),
      orderNumber: (order.orderNumber as string) || undefined,
      customerName: (order.customerName as string) || 'Guest Customer',
      customerEmail: (order.customerEmail as string) || 'N/A',
      customerPhone: (order.phone as string) || 'N/A',
      deliveryAddress: (order.deliveryAddress as string) || 'N/A',
      items,
      subtotalKes: order.totalKes as number,
      deliveryFeeKes: 0, // Can be calculated if needed
      totalKes: order.totalKes as number,
      paymentMethod: (order.paymentMethod as string) || 'N/A',
      paymentStatus: (order.paymentStatus as string) || 'pending',
      orderDate: new Date((order._creationTime as number) || Date.now()).toISOString(),
      notes: (order.notes as string) || undefined,
    };

    // Generate PDF
    const pdfStream = generateReceiptPDF(receiptData);

    // Set response headers for PDF download
    const filename = `receipt-${receiptData.ticketNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF stream to response
    pdfStream.pipe(res);

    // Handle stream errors
    pdfStream.on('error', (error) => {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate receipt' });
      }
    });

  } catch (error) {
    console.error('Receipt download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate receipt' });
    }
  }
});

export default router;
