/**
 * PDF Receipt Generator
 * Generates professional branded PDF receipts for Ari Water orders
 */

import PDFDocument from 'pdfkit';
import type { Readable } from 'stream';

export interface ReceiptData {
  orderId: string;
  ticketNumber: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    productName: string;
    packSize: string;
    quantity: number;
    unitPriceKes: number;
    totalKes: number;
  }>;
  subtotalKes: number;
  deliveryFeeKes?: number;
  totalKes: number;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  notes?: string;
}

export function generateReceiptPDF(data: ReceiptData): Readable {
  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Receipt - ${data.ticketNumber}`,
      Author: 'Ari Water',
      Subject: 'Order Receipt',
      Keywords: 'receipt, order, ari water',
    },
  });

  const primaryColor = '#0EA5E9'; // Sky blue (primary color)
  const secondaryColor = '#1E293B'; // Slate 900
  const lightGray = '#CBD5E1'; // Slate 300
  const mediumGray = '#64748B'; // Slate 500

  // Company Header
  doc
    .fillColor(primaryColor)
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('ARI WATER', 50, 50);

  doc
    .fillColor(mediumGray)
    .fontSize(10)
    .font('Helvetica')
    .text('Premium Purified Water', 50, 85)
    .text('Nairobi, Kenya', 50, 100)
    .text('Phone: +254 700 000 000', 50, 115)
    .text('Email: info@ariwater.co.ke', 50, 130);

  // Receipt Title
  doc
    .fillColor(secondaryColor)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('ORDER RECEIPT', 350, 50, { align: 'right' });

  // Receipt details (right side)
  doc
    .fillColor(mediumGray)
    .fontSize(10)
    .font('Helvetica')
    .text(`Receipt #: ${data.ticketNumber}`, 350, 85, { align: 'right' })
    .text(`Order ID: ${data.orderNumber || data.orderId}`, 350, 100, { align: 'right' })
    .text(`Date: ${new Date(data.orderDate).toLocaleDateString('en-GB')}`, 350, 115, { align: 'right' })
    .text(`Time: ${new Date(data.orderDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, 350, 130, { align: 'right' });

  // Horizontal line
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, 160)
    .lineTo(545, 160)
    .stroke();

  // Customer Information Section
  let yPosition = 180;

  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('CUSTOMER INFORMATION', 50, yPosition);

  yPosition += 20;

  doc
    .fillColor(mediumGray)
    .fontSize(10)
    .font('Helvetica')
    .text('Name:', 50, yPosition)
    .font('Helvetica-Bold')
    .fillColor(secondaryColor)
    .text(data.customerName, 120, yPosition);

  yPosition += 15;

  doc
    .font('Helvetica')
    .fillColor(mediumGray)
    .text('Email:', 50, yPosition)
    .font('Helvetica-Bold')
    .fillColor(secondaryColor)
    .text(data.customerEmail, 120, yPosition);

  yPosition += 15;

  doc
    .font('Helvetica')
    .fillColor(mediumGray)
    .text('Phone:', 50, yPosition)
    .font('Helvetica-Bold')
    .fillColor(secondaryColor)
    .text(data.customerPhone, 120, yPosition);

  yPosition += 15;

  doc
    .font('Helvetica')
    .fillColor(mediumGray)
    .text('Delivery:', 50, yPosition)
    .font('Helvetica-Bold')
    .fillColor(secondaryColor)
    .text(data.deliveryAddress, 120, yPosition, { width: 400 });

  yPosition += data.deliveryAddress.length > 50 ? 30 : 20;

  // Horizontal line
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 20;

  // Order Items Table
  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('ORDER ITEMS', 50, yPosition);

  yPosition += 20;

  // Table Header
  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('ITEM', 50, yPosition)
    .text('SIZE', 280, yPosition)
    .text('QTY', 360, yPosition)
    .text('PRICE', 420, yPosition, { align: 'right', width: 60 })
    .text('TOTAL', 490, yPosition, { align: 'right', width: 55 });

  yPosition += 5;

  // Table Header Underline
  doc
    .strokeColor(primaryColor)
    .lineWidth(1)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 15;

  // Table Rows
  data.items.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
    
    // Alternating row background
    if (index % 2 === 0) {
      doc
        .rect(50, yPosition - 5, 495, 20)
        .fillColor(bgColor)
        .fill();
    }

    doc
      .fillColor(secondaryColor)
      .fontSize(9)
      .font('Helvetica')
      .text(item.productName, 50, yPosition, { width: 220 })
      .text(item.packSize, 280, yPosition)
      .text(item.quantity.toString(), 360, yPosition)
      .text(`KES ${item.unitPriceKes.toLocaleString()}`, 420, yPosition, { align: 'right', width: 60 })
      .text(`KES ${item.totalKes.toLocaleString()}`, 490, yPosition, { align: 'right', width: 55 });

    yPosition += 20;
  });

  yPosition += 10;

  // Totals Section
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(350, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 15;

  // Subtotal
  doc
    .fillColor(mediumGray)
    .fontSize(10)
    .font('Helvetica')
    .text('Subtotal:', 350, yPosition)
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .text(`KES ${data.subtotalKes.toLocaleString()}`, 490, yPosition, { align: 'right', width: 55 });

  yPosition += 15;

  // Delivery Fee (if applicable)
  if (data.deliveryFeeKes && data.deliveryFeeKes > 0) {
    doc
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Delivery Fee:', 350, yPosition)
      .fillColor(secondaryColor)
      .font('Helvetica-Bold')
      .text(`KES ${data.deliveryFeeKes.toLocaleString()}`, 490, yPosition, { align: 'right', width: 55 });

    yPosition += 15;
  }

  // Total
  doc
    .strokeColor(primaryColor)
    .lineWidth(2)
    .moveTo(350, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 12;

  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('TOTAL:', 350, yPosition)
    .fontSize(14)
    .text(`KES ${data.totalKes.toLocaleString()}`, 490, yPosition, { align: 'right', width: 55 });

  yPosition += 25;

  // Payment Information
  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 20;

  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('PAYMENT INFORMATION', 50, yPosition);

  yPosition += 20;

  doc
    .fillColor(mediumGray)
    .fontSize(10)
    .font('Helvetica')
    .text('Payment Method:', 50, yPosition)
    .font('Helvetica-Bold')
    .fillColor(secondaryColor)
    .text(data.paymentMethod === 'mpesa' ? 'M-Pesa' : data.paymentMethod === 'pay_later' ? 'Pay Later' : data.paymentMethod.toUpperCase(), 150, yPosition);

  yPosition += 15;

  const statusColor = data.paymentStatus === 'completed' ? '#10B981' : data.paymentStatus === 'failed' ? '#EF4444' : '#F59E0B';
  const statusText = data.paymentStatus === 'completed' ? 'PAID' : data.paymentStatus === 'pending' ? 'PENDING' : data.paymentStatus.toUpperCase();

  doc
    .fillColor(mediumGray)
    .font('Helvetica')
    .text('Payment Status:', 50, yPosition)
    .font('Helvetica-Bold')
    .fillColor(statusColor)
    .text(statusText, 150, yPosition);

  yPosition += 25;

  // Notes (if any)
  if (data.notes) {
    doc
      .fillColor(secondaryColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('DELIVERY NOTES:', 50, yPosition);

    yPosition += 15;

    doc
      .fillColor(mediumGray)
      .fontSize(9)
      .font('Helvetica-Oblique')
      .text(data.notes, 50, yPosition, { width: 495 });

    yPosition += 25;
  }

  // Footer
  const footerY = 750;

  doc
    .strokeColor(lightGray)
    .lineWidth(1)
    .moveTo(50, footerY)
    .lineTo(545, footerY)
    .stroke();

  doc
    .fillColor(mediumGray)
    .fontSize(8)
    .font('Helvetica')
    .text('Thank you for choosing Ari Water!', 50, footerY + 15, { align: 'center', width: 495 })
    .text('For support, contact us at support@ariwater.co.ke or call +254 700 000 000', 50, footerY + 28, { align: 'center', width: 495 })
    .text(`This is a computer-generated receipt and does not require a signature.`, 50, footerY + 41, { align: 'center', width: 495 });

  // Finalize PDF
  doc.end();

  return doc as unknown as Readable;
}
