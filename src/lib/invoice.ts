import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';

export interface InvoiceOrderData {
  id: string;
  orderNumber: string;
  createdAt: Date;
  email: string;
  phone: string;
  status: string;
  subtotal: number; // in paise
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  coupon?: { code: string } | null;
  payment?: {
    method: string | null;
    razorpayPaymentId: string | null;
    status: string;
  } | null;
  address?: {
    name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: {
    productTitle: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

export function generateInvoiceHTML(order: InvoiceOrderData): string {
  const isKarnataka = (order.address?.state || '').toLowerCase().includes('karnataka');
  const invoiceDate = format(new Date(order.createdAt), 'dd MMMM yyyy');
  const invoiceNumber = `INV-${order.orderNumber.replace('PRX-', '')}`;

  // Tax breakdown (GST 12% on printed art - HSN 4911)
  // Taxable value = subtotal - discount
  const taxablePaise = Math.max(0, order.subtotal - order.discountTotal);
  const taxRate = 12;
  const cgstPaise = isKarnataka ? Math.round(taxablePaise * 0.06) : 0;
  const sgstPaise = isKarnataka ? Math.round(taxablePaise * 0.06) : 0;
  const igstPaise = !isKarnataka ? Math.round(taxablePaise * 0.12) : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GST Tax Invoice — ${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #141414; background: #fff; padding: 40px; font-size: 12px; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #141414; padding-bottom: 20px; margin-bottom: 25px; }
    .brand { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: Georgia, serif; }
    .brand span { color: #C9491C; }
    .title { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #141414; text-align: right; }
    .meta-table { width: 100%; margin-bottom: 25px; }
    .meta-table td { vertical-align: top; width: 50%; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #777; letter-spacing: 1px; margin-bottom: 6px; }
    .info-box { background: #fafaf8; border: 1px solid #e5e3de; padding: 14px; border-radius: 3px; font-size: 11.5px; }
    .info-box p { margin-bottom: 3px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .items-table th { background: #141414; color: #fff; text-align: left; padding: 9px 12px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #e5e3de; font-size: 11.5px; }
    .items-table tr:last-child td { border-bottom: 2px solid #141414; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-container { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .totals-table { width: 320px; border-collapse: collapse; }
    .totals-table td { padding: 6px 10px; font-size: 11.5px; }
    .totals-table tr.grand-total td { font-size: 14px; font-weight: 700; border-top: 2px solid #141414; padding-top: 10px; color: #141414; }
    .footer { border-top: 1px solid #e5e3de; padding-top: 18px; display: flex; justify-content: space-between; font-size: 10.5px; color: #666; }
    .stamp { display: inline-block; border: 2px dashed #C9491C; color: #C9491C; padding: 4px 10px; border-radius: 3px; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .print-btn { background: #141414; color: #fff; border: none; padding: 10px 20px; font-size: 12px; font-weight: 600; cursor: pointer; border-radius: 3px; margin-bottom: 25px; }
    @media print {
      body { padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

    <div class="header">
      <div>
        <div class="brand">POSTER<span>raxx</span></div>
        <p style="color: #666; font-size: 11px; margin-top: 4px;">POSTERraxx Design Studios India Pvt. Ltd.</p>
        <p style="color: #666; font-size: 11px;">100ft Road, Indiranagar, Bangalore, Karnataka - 560038</p>
        <p style="color: #666; font-size: 11px;">GSTIN: <strong>29AABCU9603R1ZM</strong> · State: Karnataka (29)</p>
      </div>
      <div>
        <div class="title">Tax Invoice</div>
        <p style="margin-top: 6px; font-size: 12px;"><strong>Invoice No:</strong> ${invoiceNumber}</p>
        <p style="font-size: 12px;"><strong>Date:</strong> ${invoiceDate}</p>
        <p style="font-size: 12px;"><strong>Order ID:</strong> ${order.orderNumber}</p>
        <p style="margin-top: 6px;"><span class="stamp">${order.payment?.status === 'CAPTURED' || order.status === 'PAID' ? 'PAID & VERIFIED' : order.status}</span></p>
      </div>
    </div>

    <table class="meta-table">
      <tr>
        <td style="padding-right: 12px;">
          <div class="section-title">Billed & Shipped To:</div>
          <div class="info-box">
            <p><strong>${order.address?.name || 'Customer'}</strong></p>
            <p>${order.address?.line1 || 'Online Store Order'}</p>
            ${order.address?.line2 ? `<p>${order.address.line2}</p>` : ''}
            <p>${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.pincode || ''}</p>
            <p style="margin-top: 6px; color: #555;">Phone: ${order.address?.phone || order.phone} · Email: ${order.email}</p>
          </div>
        </td>
        <td style="padding-left: 12px;">
          <div class="section-title">Payment & Dispatch Info:</div>
          <div class="info-box">
            <p><strong>Payment Mode:</strong> ${order.payment?.method ? order.payment.method.toUpperCase() : 'Online (Razorpay / UPI)'}</p>
            ${order.payment?.razorpayPaymentId ? `<p><strong>Txn Ref:</strong> ${order.payment.razorpayPaymentId}</p>` : ''}
            <p><strong>Place of Supply:</strong> ${order.address?.state || 'Karnataka'}</p>
            <p><strong>Reverse Charge:</strong> No</p>
          </div>
        </td>
      </tr>
    </table>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 35px;">#</th>
          <th>Description of Art Prints</th>
          <th class="text-center" style="width: 80px;">HSN/SAC</th>
          <th class="text-center" style="width: 45px;">Qty</th>
          <th class="text-right" style="width: 90px;">Rate</th>
          <th class="text-right" style="width: 100px;">Taxable Amt</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item, idx) => `
          <tr>
            <td class="text-center" style="color: #888;">${idx + 1}</td>
            <td>
              <strong>${item.productTitle}</strong>
              <div style="color: #666; font-size: 10.5px; margin-top: 2px;">${item.variantLabel}</div>
            </td>
            <td class="text-center font-mono">4911</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right font-mono">${formatINR(item.unitPrice)}</td>
            <td class="text-right font-mono">${formatINR(item.lineTotal)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="totals-container">
      <table class="totals-table">
        <tr>
          <td>Item Subtotal:</td>
          <td class="text-right font-mono">${formatINR(order.subtotal)}</td>
        </tr>
        ${
          order.discountTotal > 0
            ? `<tr>
                <td style="color: #C9491C;">Discount (${order.coupon?.code || 'COUPON'}):</td>
                <td class="text-right font-mono" style="color: #C9491C;">-${formatINR(order.discountTotal)}</td>
              </tr>`
            : ''
        }
        <tr>
          <td>Shipping / Delivery:</td>
          <td class="text-right font-mono">${order.shippingTotal === 0 ? 'FREE' : formatINR(order.shippingTotal)}</td>
        </tr>
        ${
          isKarnataka
            ? `<tr>
                <td style="color: #666;">CGST (6%):</td>
                <td class="text-right font-mono" style="color: #666;">${formatINR(cgstPaise)}</td>
              </tr>
              <tr>
                <td style="color: #666;">SGST (6%):</td>
                <td class="text-right font-mono" style="color: #666;">${formatINR(sgstPaise)}</td>
              </tr>`
            : `<tr>
                <td style="color: #666;">Integrated GST (IGST 12%):</td>
                <td class="text-right font-mono" style="color: #666;">${formatINR(igstPaise)}</td>
              </tr>`
        }
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td class="text-right font-mono">${formatINR(order.total)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <div>
        <p>Thank you for choosing POSTERraxx to elevate your space.</p>
        <p>For questions or support, reach us at orders@posterraxx.com</p>
      </div>
      <div style="text-align: right;">
        <p>This is a computer-generated tax invoice. No physical signature is required.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
