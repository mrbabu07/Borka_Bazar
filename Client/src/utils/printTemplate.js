const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getOrderId = (order) =>
  order.orderCode || order._id?.toString?.()?.slice(-8)?.toUpperCase() || "ORDER";

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (value) => {
  const amount = Number(value || 0);
  return `৳${Math.round(amount).toLocaleString()}`;
};

const renderColor = (color) => {
  if (!color) return "";
  if (typeof color === "string") return color;
  if (typeof color === "object" && color.name) return color.name;
  return "Unknown";
};

const getStatusClass = (status) => {
  const normalized = status.toLowerCase();
  if (normalized === "delivered") return "success";
  if (normalized === "shipped") return "info";
  if (normalized === "processing" || normalized === "confirmed") return "blue";
  if (normalized === "cancelled" || normalized === "canceled") return "danger";
  return "warning";
};

const joinAddress = (shipping = {}, customer = {}) =>
  [
    customer.address || shipping.address,
    shipping.area,
    shipping.union,
    shipping.upazila,
    shipping.district || shipping.city,
    shipping.division,
    shipping.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

export const generateProfessionalInvoice = (order) => {
  const customer = order.customer || {};
  const shipping = order.shippingInfo || {};
  const items = order.orderItems || order.products || [];
  const orderId = getOrderId(order);
  const orderStatus = (order.orderStatus || order.order?.status || order.status || "pending")
    .toString()
    .toLowerCase();

  const subtotal = order.subtotal || order.pricing?.subtotal || 0;
  const deliveryCharge =
    order.deliveryFee ?? order.deliveryCharge ?? order.pricing?.deliveryFee ?? 0;
  const paidAmount = order.paidAmount ?? deliveryCharge;
  const discount = order.couponDiscount ?? order.totalDiscount ?? order.pricing?.discount ?? 0;
  const total =
    order.totalAmount ??
    order.totalPrice ??
    order.pricing?.total ??
    order.total ??
    subtotal + deliveryCharge - discount;
  const dueAmount =
    order.dueAmount ?? order.pricing?.remainingAmount ?? Math.max(total - paidAmount, 0);

  const paymentMethod =
    order.paymentInfo?.method ||
    order.advancePayment?.method ||
    order.payment?.advance?.method ||
    order.paymentMethod ||
    "N/A";
  const paymentStatus =
    order.deliveryPaymentStatus ||
    order.paymentInfo?.status ||
    order.advancePayment?.status ||
    order.payment?.paymentStatus ||
    "Pending";
  const transactionId =
    order.paymentInfo?.transactionId ||
    order.advancePayment?.transactionId ||
    order.payment?.advance?.transactionId ||
    order.transactionId;
  const senderNumber =
    order.senderNumber || order.advancePayment?.senderNumber || order.payment?.advance?.senderNumber;
  const receiverNumber =
    order.receiverNumber || order.advancePayment?.receiverNumber || order.payment?.advance?.receiverNumber;

  const customerName = customer.name || shipping.name || "Customer";
  const customerPhone = customer.phone || shipping.phone || "N/A";
  const customerEmail = customer.email || shipping.email || "N/A";
  const fullAddress = joinAddress(shipping, customer) || "N/A";

  const rows = items
    .map((item, index) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const size = item.size || item.selectedSize || item.variant?.size;
      const color = renderColor(item.color || item.selectedColor || item.variant?.color);
      const productId = item.productId || item._id;
      const image = item.image || item.selectedImage;

      return `
        <tr>
          <td class="item-index">${index + 1}</td>
          <td>
            <div class="item-cell">
              ${
                image
                  ? `<img class="item-image" src="${escapeHtml(image)}" alt="${escapeHtml(item.title || "Product")}" />`
                  : `<div class="item-image placeholder">No image</div>`
              }
              <div>
                <div class="item-title">${escapeHtml(item.title || "Product")}</div>
                <div class="item-meta">
                  ${size ? `<span>Size: ${escapeHtml(size)}</span>` : ""}
                  ${color ? `<span>Color: ${escapeHtml(color)}</span>` : ""}
                  ${productId ? `<span>SKU: ${escapeHtml(String(productId).slice(-8))}</span>` : ""}
                </div>
              </div>
            </div>
          </td>
          <td class="numeric">${quantity}</td>
          <td class="numeric">${formatPrice(price)}</td>
          <td class="numeric strong">${formatPrice(price * quantity)}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt #${escapeHtml(orderId)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef1f5;
      color: #111827;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
    }
    .header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 24px;
      padding: 26px 32px;
      color: #fff;
      background: #111827;
    }
    .brand {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 32px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.3px;
    }
    .tagline {
      margin-top: 6px;
      color: #cbd5e1;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .receipt-title {
      text-align: right;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #cbd5e1;
      font-size: 11px;
      font-weight: 800;
    }
    .receipt-code {
      margin-top: 5px;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #fff;
    }
    .receipt-date {
      margin-top: 6px;
      color: #d1d5db;
      font-size: 12px;
    }
    .content { padding: 26px 32px 20px; }
    .summary-strip {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }
    .metric {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px;
      background: #f8fafc;
    }
    .metric.cod { background: #fff7ed; border-color: #fed7aa; }
    .metric.paid { background: #ecfdf5; border-color: #bbf7d0; }
    .metric .label {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: #64748b;
    }
    .metric .value {
      margin-top: 5px;
      font-size: 24px;
      font-weight: 900;
      color: #111827;
    }
    .metric.cod .value { color: #c2410c; }
    .metric.paid .value { color: #047857; }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }
    .panel {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px;
      min-height: 118px;
    }
    .panel-title {
      margin-bottom: 8px;
      color: #475569;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1.3px;
      text-transform: uppercase;
    }
    .person {
      font-size: 15px;
      font-weight: 850;
      color: #0f172a;
    }
    .muted { color: #64748b; }
    .small { font-size: 11px; }
    .line { margin-top: 4px; }
    .status {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.7px;
      text-transform: uppercase;
    }
    .status.success { background: #dcfce7; color: #166534; }
    .status.info { background: #f3e8ff; color: #6b21a8; }
    .status.blue { background: #dbeafe; color: #1d4ed8; }
    .status.danger { background: #fee2e2; color: #991b1b; }
    .status.warning { background: #fef3c7; color: #92400e; }
    .kv {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 4px 0;
      border-bottom: 1px dashed #e5e7eb;
    }
    .kv:last-child { border-bottom: 0; }
    .kv span:first-child { color: #64748b; }
    .kv span:last-child { font-weight: 750; text-align: right; }
    .section-title {
      margin: 18px 0 10px;
      color: #0f172a;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    thead { background: #f8fafc; }
    th {
      padding: 10px;
      color: #475569;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    td {
      padding: 10px;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
    }
    tbody tr:last-child td { border-bottom: 0; }
    .item-index {
      width: 32px;
      color: #64748b;
      font-weight: 800;
      text-align: center;
    }
    .item-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .item-image {
      width: 48px;
      height: 56px;
      object-fit: cover;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #f8fafc;
    }
    .item-image.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 9px;
      text-align: center;
    }
    .item-title {
      font-size: 12px;
      font-weight: 850;
      color: #0f172a;
    }
    .item-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 5px;
    }
    .item-meta span {
      border-radius: 999px;
      background: #eef2ff;
      color: #3730a3;
      padding: 2px 7px;
      font-size: 9px;
      font-weight: 800;
    }
    .numeric { text-align: right; white-space: nowrap; }
    .strong { font-weight: 900; }
    .bottom-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 18px;
      margin-top: 18px;
    }
    .notes {
      border: 1px solid #fde68a;
      border-radius: 8px;
      background: #fffbeb;
      padding: 12px;
      color: #78350f;
      min-height: 78px;
    }
    .totals {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px;
      background: #f8fafc;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      padding: 6px 0;
      color: #475569;
    }
    .total-row strong { color: #111827; }
    .total-row.grand {
      margin-top: 6px;
      border-top: 2px solid #cbd5e1;
      padding-top: 12px;
      color: #111827;
      font-size: 17px;
      font-weight: 900;
    }
    .footer {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 18px;
      align-items: end;
      padding: 18px 32px 24px;
      border-top: 1px solid #e5e7eb;
      color: #64748b;
      font-size: 11px;
    }
    .signature {
      min-width: 170px;
      padding-top: 28px;
      border-top: 1px solid #94a3b8;
      text-align: center;
      color: #334155;
      font-weight: 800;
    }
    .print-actions {
      width: 210mm;
      margin: 14px auto;
      text-align: center;
    }
    .print-actions button {
      border: 0;
      border-radius: 8px;
      background: #111827;
      color: #fff;
      padding: 11px 22px;
      font-weight: 850;
      cursor: pointer;
    }
    @media print {
      body { background: #fff; }
      .sheet {
        width: auto;
        min-height: auto;
        margin: 0;
        box-shadow: none;
      }
      .print-actions { display: none; }
      .header, .metric, .panel, .totals, .notes {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      a[href]::after { content: ""; }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <header class="header">
      <div>
        <div class="brand">Dubai Borka Bazar Hnila</div>
        <div class="tagline">Modern Modest Fashion</div>
      </div>
      <div>
        <div class="receipt-title">Parcel Receipt</div>
        <div class="receipt-code">#${escapeHtml(orderId)}</div>
        <div class="receipt-date">${escapeHtml(formatDate(order.createdAt))}</div>
      </div>
    </header>

    <section class="content">
      <div class="summary-strip">
        <div class="metric paid">
          <div class="label">Delivery Paid</div>
          <div class="value">${formatPrice(paidAmount)}</div>
        </div>
        <div class="metric cod">
          <div class="label">Collect COD</div>
          <div class="value">${formatPrice(dueAmount)}</div>
        </div>
        <div class="metric">
          <div class="label">Customer Phone</div>
          <div class="value small">${escapeHtml(customerPhone)}</div>
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">Customer</div>
          <div class="person">${escapeHtml(customerName)}</div>
          <div class="line">${escapeHtml(customerPhone)}</div>
          <div class="line muted small">${escapeHtml(customerEmail)}</div>
        </div>

        <div class="panel">
          <div class="panel-title">Delivery Address</div>
          <div class="person">${escapeHtml(customerName)}</div>
          <div class="line muted">${escapeHtml(fullAddress)}</div>
        </div>

        <div class="panel">
          <div class="panel-title">Order Details</div>
          <div class="kv"><span>Status</span><span><span class="status ${getStatusClass(orderStatus)}">${escapeHtml(orderStatus)}</span></span></div>
          <div class="kv"><span>Payment</span><span>${escapeHtml(paymentMethod.toUpperCase())}</span></div>
          <div class="kv"><span>Payment Status</span><span>${escapeHtml(paymentStatus.toString().toUpperCase())}</span></div>
          <div class="kv"><span>Items</span><span>${items.length}</span></div>
        </div>
      </div>

      <div class="grid-3">
        <div class="panel">
          <div class="panel-title">Payment Verification</div>
          <div class="kv"><span>Transaction</span><span>${escapeHtml(transactionId || "N/A")}</span></div>
          <div class="kv"><span>Sender</span><span>${escapeHtml(senderNumber || "N/A")}</span></div>
          <div class="kv"><span>Receiver</span><span>${escapeHtml(receiverNumber || "N/A")}</span></div>
        </div>
        <div class="panel">
          <div class="panel-title">Parcel Instruction</div>
          <div class="line"><strong>Collect:</strong> ${formatPrice(dueAmount)}</div>
          <div class="line muted small">Confirm size/color before packing. Call customer if address is unclear.</div>
        </div>
        <div class="panel">
          <div class="panel-title">Store Contact</div>
          <div class="line">+880 1521-721946</div>
          <div class="line muted small">mdjahedulislamjaved@gmail.com</div>
          <div class="line muted small">Dhaka, Bangladesh</div>
        </div>
      </div>

      <div class="section-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th class="item-index">#</th>
            <th>Product</th>
            <th class="numeric">Qty</th>
            <th class="numeric">Price</th>
            <th class="numeric">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows ||
            `<tr><td colspan="5" style="padding: 28px; text-align: center; color: #64748b;">No items in this order</td></tr>`
          }
        </tbody>
      </table>

      <div class="bottom-grid">
        <div>
          <div class="section-title">Special Notes</div>
          <div class="notes">
            ${escapeHtml(order.specialInstructions || "No special instructions.")}
          </div>
        </div>
        <div>
          <div class="section-title">Payment Summary</div>
          <div class="totals">
            <div class="total-row"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>
            <div class="total-row"><span>Discount</span><strong>${formatPrice(discount)}</strong></div>
            <div class="total-row"><span>Delivery Charge</span><strong>${formatPrice(deliveryCharge)}</strong></div>
            <div class="total-row"><span>Delivery Paid</span><strong>${formatPrice(paidAmount)}</strong></div>
            <div class="total-row"><span>COD Due</span><strong>${formatPrice(dueAmount)}</strong></div>
            <div class="total-row grand"><span>Total</span><span>${formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div>
        <strong>Thank you for shopping with Dubai Borka Bazar Hnila.</strong><br />
        Generated ${escapeHtml(formatDate(new Date()))}. This receipt is computer generated for parcel processing.
      </div>
      <div class="signature">Packed By</div>
    </footer>
  </main>

  <div class="print-actions">
    <button onclick="window.print()">Print Receipt</button>
  </div>
</body>
</html>
  `;
};
