import { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus } from "../../services/api";
import { useCurrency } from "../../hooks/useCurrency";
import Loading from "../../components/Loading";
import toast, { Toaster } from "react-hot-toast";
import { generateProfessionalInvoice } from "../../utils/printTemplate";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const { formatPrice } = useCurrency();

  // Utility function to safely render color
  const renderColor = (color) => {
    if (!color) return null;
    if (typeof color === "string") return color;
    if (typeof color === "object" && color.name) return color.name;
    return "Unknown Color";
  };

  const getAdvancePaymentInfo = (order) => {
    return order.advancePayment || order.payment?.advance || null;
  };

  const isAdvancePaymentPending = (order) => {
    const advancePayment = getAdvancePaymentInfo(order);
    return advancePayment?.status === "Pending";
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getAllOrders();
      setOrders(response.data.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const loadingToast = toast.loading("Updating order status...");
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order,
        ),
      );

      // Note: Notification will be sent to the customer's account
      // This would require backend implementation to send notifications to specific users

      toast.success(`Order status updated to ${newStatus}!`, {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status", {
        id: loadingToast,
      });
    }
  };

  const handleConfirmAdvancePayment = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter a transaction ID");
      return;
    }

    setConfirmingPayment(true);
    const loadingToast = toast.loading("Confirming advance payment...");

    try {
      const response = await fetch(
        `/api/orders/${selectedOrderForPayment._id}/confirm-advance-payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            transactionId: transactionId.trim(),
            adminId: localStorage.getItem("adminId"),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to confirm payment");
      }

      const data = await response.json();

      // Update the order in the list
      setOrders(
        orders.map((order) =>
          order._id === selectedOrderForPayment._id
            ? {
                ...order,
                advancePayment: {
                  ...order.advancePayment,
                  status: "Confirmed",
                  transactionId: transactionId.trim(),
                  confirmedAt: new Date(),
                },
                orderStatus: "Processing",
                status: "processing",
              }
            : order
        )
      );

      toast.success("Advance payment confirmed successfully!", {
        id: loadingToast,
      });

      // Close modal and reset
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setTransactionId("");
    } catch (error) {
      console.error("Payment confirmation error:", error);
      toast.error(error.message || "Failed to confirm payment", {
        id: loadingToast,
      });
    } finally {
      setConfirmingPayment(false);
    }
  };

  const printOrder = (order) => {
    try {
      // Create print content using professional template
      const printContent = generateProfessionalInvoice(order);

      // Create a new window for printing
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (!printWindow) {
        // Fallback: Use iframe method if popup is blocked
        printOrderWithIframe(order);
        return;
      }

      // Write content to the new window
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();

        // Close window after printing (with delay to ensure print dialog appears)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };
    } catch (error) {
      console.error("Print error:", error);
      // Fallback to iframe method
      printOrderWithIframe(order);
    }
  };

  const printOrderWithIframe = (order) => {
    try {
      // Create hidden iframe for printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.top = "-9999px";
      iframe.style.left = "-9999px";
      iframe.style.width = "0px";
      iframe.style.height = "0px";

      document.body.appendChild(iframe);

      const printContent = generateProfessionalInvoice(order);
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      // Wait for content to load, then print
      iframe.onload = function () {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
    } catch (error) {
      console.error("Iframe print error:", error);
      alert(
        "Unable to print. Please check your browser settings and try again.",
      );
    }
  };

  const generatePrintContent = (order) => {
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const subtotal = order.subtotal || order.total || 0;
    const deliveryCharge = order.deliveryCharge || 0;
    const total = order.total || 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order._id.slice(-8).toUpperCase()} - Borka Bazar</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #1e7098;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e7098;
            margin-bottom: 5px;
          }
          
          .company-tagline {
            color: #666;
            font-size: 14px;
          }
          
          .order-header {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #1e7098;
          }
          
          .order-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e7098;
            margin-bottom: 10px;
          }
          
          .order-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
          }
          
          .meta-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          
          .meta-label {
            font-weight: bold;
            color: #555;
          }
          
          .meta-value {
            color: #333;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .status-pending { background: #fff3cd; color: #856404; }
          .status-processing { background: #cce5ff; color: #004085; }
          .status-shipped { background: #e2e3ff; color: #383d41; }
          .status-delivered { background: #d4edda; color: #155724; }
          .status-cancelled { background: #f8d7da; color: #721c24; }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e7098;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e9ecef;
          }
          
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          
          .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }
          
          .info-item {
            margin-bottom: 12px;
          }
          
          .info-label {
            font-weight: bold;
            color: #495057;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .info-value {
            color: #212529;
            font-size: 14px;
          }
          
          .address-box {
            background: white;
            border: 2px solid #1e7098;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            white-space: pre-line;
            line-height: 1.8;
          }
          
          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          
          .products-table th,
          .products-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
          }
          
          .products-table th {
            background: #f8f9fa;
            font-weight: bold;
            color: #495057;
            border-bottom: 2px solid #1e7098;
          }
          
          .product-image {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #dee2e6;
          }
          
          .product-details {
            font-size: 13px;
            color: #666;
            margin-top: 4px;
          }
          
          .total-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            margin-top: 20px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
          }
          
          .total-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 16px;
            color: #1e7098;
            border-top: 2px solid #1e7098;
            padding-top: 12px;
            margin-top: 8px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          
          .print-date {
            margin-top: 10px;
            font-style: italic;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
            
            .section {
              page-break-inside: avoid;
            }
            
            .order-header {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="company-name">Borka Bazar</div>
          <div class="company-tagline">Elegant Modest Fashion</div>
        </div>

        <!-- Order Header -->
        <div class="order-header">
          <div class="order-title">Order #${order._id.slice(-8).toUpperCase()}</div>
          <div class="order-meta">
            <div>
              <div class="meta-item">
                <span class="meta-label">Order Date:</span>
                <span class="meta-value">${orderDate}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Payment Method:</span>
                <span class="meta-value">${order.paymentMethod ? order.paymentMethod.toUpperCase() : "N/A"}</span>
              </div>
            </div>
            <div>
              <div class="meta-item">
                <span class="meta-label">Status:</span>
                <span class="meta-value">
                  <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Total Amount:</span>
                <span class="meta-value" style="font-weight: bold; color: #1e7098;">${formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer & Shipping Information -->
        <div class="section">
          <div class="section-title">📋 Customer & Shipping Information</div>
          <div class="two-column">
            <!-- Customer Info -->
            <div>
              <h4 style="margin-bottom: 15px; color: #495057;">👤 Customer Details</h4>
              <div class="info-card">
                ${
                  order.shippingInfo
                    ? `
                  <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${order.shippingInfo.name || "N/A"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone Number</div>
                    <div class="info-value">${order.shippingInfo.phone || "N/A"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">${order.shippingInfo.email || "N/A"}</div>
                  </div>
                `
                    : `
                  <div style="text-align: center; color: #666; padding: 20px;">
                    <strong>⚠️ No Customer Information Available</strong><br>
                    <small>This order was placed before customer info collection was implemented</small>
                  </div>
                `
                }
                <div class="info-item" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                  <div class="info-label">System User ID</div>
                  <div class="info-value" style="font-family: monospace; font-size: 11px; word-break: break-all;">${order.userId}</div>
                </div>
              </div>
            </div>

            <!-- Shipping Address -->
            <div>
              <h4 style="margin-bottom: 15px; color: #495057;">📍 Delivery Address</h4>
              ${
                order.shippingInfo
                  ? `
                <div class="info-card">
                  <div class="info-item">
                    <div class="info-label">Street Address</div>
                    <div class="info-value">${order.shippingInfo.address || "N/A"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Area/Thana</div>
                    <div class="info-value">${order.shippingInfo.area || "N/A"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">City/District</div>
                    <div class="info-value">${order.shippingInfo.city || "N/A"}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Postal Code</div>
                    <div class="info-value">${order.shippingInfo.zipCode || "N/A"}</div>
                  </div>
                  
                  <div style="margin-top: 15px;">
                    <div class="info-label">📦 Complete Shipping Address</div>
                    <div class="address-box">${[
                      order.shippingInfo.name,
                      order.shippingInfo.phone,
                      order.shippingInfo.address,
                      order.shippingInfo.area +
                        (order.shippingInfo.city
                          ? `, ${order.shippingInfo.city}`
                          : ""),
                      order.shippingInfo.zipCode,
                    ]
                      .filter(Boolean)
                      .join("\n")}</div>
                  </div>
                </div>
              `
                  : `
                <div class="info-card" style="text-align: center; color: #666; padding: 30px;">
                  <strong>⚠️ No Shipping Address Available</strong><br>
                  <small>Please contact customer for delivery details</small>
                </div>
              `
              }
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="section">
          <div class="section-title">🛍️ Order Items (${order.products?.length || 0} items)</div>
          <table class="products-table">
            <thead>
              <tr>
                <th style="width: 60px;">Image</th>
                <th>Product Details</th>
                <th style="width: 80px; text-align: center;">Qty</th>
                <th style="width: 100px; text-align: right;">Unit Price</th>
                <th style="width: 100px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${
                order.products
                  ?.map(
                    (item) => `
                <tr>
                  <td>
                    ${
                      item.image
                        ? `<img src="${item.image}" alt="${item.title}" class="product-image" />`
                        : '<div style="width: 40px; height: 40px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">No Image</div>'
                    }
                  </td>
                  <td>
                    <div style="font-weight: bold; margin-bottom: 4px;">${item.title}</div>
                    <div class="product-details">
                      ${(item.selectedSize || item.size || item.variant?.size) ? `Size: <strong>${item.selectedSize || item.size || item.variant?.size}</strong>` : ""}
                      ${(item.selectedSize || item.size || item.variant?.size) && (item.selectedColor || item.color || item.variant?.color) ? " • " : ""}
                      ${(item.selectedColor || item.color || item.variant?.color) ? `Color: <strong>${renderColor(item.selectedColor || item.color || item.variant?.color)}</strong>` : ""}
                      ${(item.productId || item._id) ? ` • ID: <strong>${(item.productId || item._id).slice(-6)}</strong>` : ""}
                    </div>
                    </div>
                    </div>
                  </td>
                  <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                  <td style="text-align: right;">${formatPrice(item.price)}</td>
                  <td style="text-align: right; font-weight: bold;">${formatPrice(item.price * item.quantity)}</td>
                </tr>
              `,
                  )
                  .join("") ||
                '<tr><td colspan="5" style="text-align: center; color: #666; padding: 20px;">No items found</td></tr>'
              }
            </tbody>
          </table>

          <!-- Order Total -->
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            <div class="total-row">
              <span>Delivery Charge:</span>
              <span>${deliveryCharge > 0 ? formatPrice(deliveryCharge) : "FREE"}</span>
            </div>
            <div class="total-row">
              <span>Total Amount:</span>
              <span>${formatPrice(total)}</span>
            </div>
          </div>
        </div>

        ${
          order.specialInstructions
            ? `
          <!-- Special Instructions -->
          <div class="section">
            <div class="section-title">📝 Special Instructions</div>
            <div class="info-card" style="background: #fff3cd; border-color: #ffeaa7;">
              <div style="color: #856404; font-weight: bold; margin-bottom: 8px;">Customer Notes:</div>
              <div style="color: #856404;">${order.specialInstructions}</div>
            </div>
          </div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="footer">
          <div><strong>Borka Bazar</strong> - Elegant Modest Fashion</div>
          <div>📞 Contact: +880 1521-721946 | 📧 Email: mdjahedulislamjaved@gmail.com</div>
          <div class="print-date">Printed on: ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `;
  };

  const statusConfig = {
    pending: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: "⏳",
    },
    processing: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "🔄",
    },
    shipped: {
      color: "bg-purple-100 text-purple-800 border-purple-200",
      icon: "📦",
    },
    delivered: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: "✅",
    },
    cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: "❌" },
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-950/90 border-b border-gray-100 dark:border-gray-800 sticky top-20 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage and track all customer orders
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pending}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Processing</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.processing}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Delivered</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.delivered}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-2 mb-6 flex flex-wrap gap-2 border border-gray-100 dark:border-gray-800">
          {[
            "all",
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === "all"
                ? "No orders have been placed yet"
                : `No ${filter} orders`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800"
              >
                {/* Order Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                  onClick={() =>
                    setExpandedOrder(
                      expandedOrder === order._id ? null : order._id,
                    )
                  }
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                        {statusConfig[order.status]?.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </p>
                          {order.paymentMethod && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              {order.paymentMethod.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          {order.shippingInfo?.name && (
                            <>
                              <span>•</span>
                              <span>{order.shippingInfo.name}</span>
                            </>
                          )}
                          {order.shippingInfo?.city && (
                            <>
                              <span>•</span>
                              <span>{order.shippingInfo.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {order.products?.length || 0} items
                          </span>
                          {order.products?.some(
                            (item) => item.selectedSize || item.selectedColor,
                          ) && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              Customized Items
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                          {formatPrice(order.total)}
                          {order.deliveryCharge > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              (+{formatPrice(order.deliveryCharge)} delivery)
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Quick Print Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          printOrder(order);
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Print Order Details"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                          />
                        </svg>
                      </button>

                      <select
                        value={order.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(order._id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                          statusConfig[order.status]?.color
                        } cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition ${
                          expandedOrder === order._id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedOrder === order._id && (
                  <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Items with Details */}
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-gold-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          Order Items ({order.products?.length || 0})
                        </h4>
                        <div className="space-y-3">
                          {order.products?.map((item, index) => (
                            <div
                              key={index}
                              className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm"
                            >
                              <div className="flex items-start gap-4">
                                {/* Product Image */}
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>

                                {/* Product Details */}
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                    {item.title}
                                  </h5>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">
                                        Quantity:
                                      </span>
                                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {item.quantity}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">
                                        Unit Price:
                                      </span>
                                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                        {formatPrice(item.price)}
                                      </span>
                                    </div>
                                    
                                    {/* Size - check multiple possible fields */}
                                    {(item.selectedSize || item.size || item.variant?.size) && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">
                                          Size:
                                        </span>
                                        <span className="ml-2 font-medium text-black dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-xs">
                                          {item.selectedSize || item.size || item.variant?.size}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Color - check multiple possible fields */}
                                    {(item.selectedColor || item.color || item.variant?.color) && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">
                                          Color:
                                        </span>
                                        <div className="ml-2 inline-flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md text-xs">
                                          {typeof (item.selectedColor || item.color || item.variant?.color) ===
                                            "object" &&
                                            (item.selectedColor || item.color || item.variant?.color).value && (
                                              <div
                                                className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                                                style={{
                                                  backgroundColor:
                                                    (item.selectedColor || item.color || item.variant?.color).value,
                                                }}
                                              />
                                            )}
                                          {renderColor(item.selectedColor || item.color || item.variant?.color)}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Product ID for debugging */}
                                    <div className="col-span-2">
                                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                                        Product ID:
                                      </span>
                                      <span className="ml-2 font-mono text-xs text-gray-600 dark:text-gray-300">
                                        {item.productId || item._id}
                                      </span>
                                    </div>
                                    
                                    <div className="col-span-2">
                                      <span className="text-gray-500 dark:text-gray-400">
                                        Subtotal:
                                      </span>
                                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                        {formatPrice(
                                          (item.price || 0) *
                                            (item.quantity || 0),
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Order Total Breakdown */}
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                              Order Summary
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                                <span className="text-gray-900 dark:text-white">
                                  {formatPrice(order.subtotal || order.total)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">
                                  Delivery Charge:
                                </span>
                                <span className="text-gray-900 dark:text-white">
                                  {order.deliveryCharge
                                    ? formatPrice(order.deliveryCharge)
                                    : "FREE"}
                                </span>
                              </div>
                              <div className="border-t pt-2 flex justify-between font-semibold">
                                <span className="text-gray-900 dark:text-white">Total:</span>
                                <span className="text-black dark:text-white">
                                  {formatPrice(order.total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer & Shipping Information */}
                      <div className="space-y-6">
                        {/* Customer Details */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Customer Information
                          </h4>
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                            {order.shippingInfo ? (
                              <>
                                {order.shippingInfo.name && (
                                  <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                                      Full Name
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                      {order.shippingInfo.name}
                                    </p>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 gap-4">
                                  {order.shippingInfo.phone && (
                                    <div>
                                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                                        Phone Number
                                      </span>
                                      <p className="text-sm text-gray-900 mt-1">
                                        <a
                                          href={`tel:${order.shippingInfo.phone}`}
                                          className="text-blue-600 hover:underline font-medium"
                                        >
                                          {order.shippingInfo.phone}
                                        </a>
                                      </p>
                                    </div>
                                  )}

                                  {order.shippingInfo.email && (
                                    <div>
                                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                                        Email Address
                                      </span>
                                      <p className="text-sm text-gray-900 mt-1">
                                        <a
                                          href={`mailto:${order.shippingInfo.email}`}
                                          className="text-blue-600 hover:underline"
                                        >
                                          {order.shippingInfo.email}
                                        </a>
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-6">
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <svg
                                    className="w-6 h-6 text-yellow-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  No Customer Information
                                </p>
                                <p className="text-xs text-gray-500">
                                  This order was placed before customer info
                                  collection was implemented
                                </p>
                              </div>
                            )}

                            {/* Firebase User ID for reference */}
                            <div className="pt-3 border-t border-gray-100">
                              <span className="text-xs text-gray-500 uppercase tracking-wide">
                                System Reference
                              </span>
                              <p className="font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">
                                User ID: {order.userId}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shippingInfo && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              Delivery Address
                            </h4>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="space-y-3">
                                {/* Address Details */}
                                {order.shippingInfo.address && (
                                  <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                                      Street Address
                                    </span>
                                    <p className="text-sm text-gray-900 mt-1 leading-relaxed">
                                      {order.shippingInfo.address}
                                    </p>
                                  </div>
                                )}

                                {/* Location Details */}
                                <div className="grid grid-cols-2 gap-4">
                                  {order.shippingInfo.area && (
                                    <div>
                                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                                        Area/Thana
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 mt-1">
                                        {order.shippingInfo.area}
                                      </p>
                                    </div>
                                  )}

                                  {order.shippingInfo.city && (
                                    <div>
                                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                                        City/District
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 mt-1">
                                        {order.shippingInfo.city}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {order.shippingInfo.zipCode && (
                                  <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                                      Postal Code
                                    </span>
                                    <p className="text-sm text-gray-900 mt-1">
                                      {order.shippingInfo.zipCode}
                                    </p>
                                  </div>
                                )}

                                {/* Complete Address for Shipping Label */}
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                      📦 Shipping Label Address
                                    </span>
                                    <button
                                      onClick={() => {
                                        const fullAddress = [
                                          order.shippingInfo.name,
                                          order.shippingInfo.phone,
                                          order.shippingInfo.address,
                                          order.shippingInfo.area,
                                          order.shippingInfo.city,
                                          order.shippingInfo.zipCode,
                                        ]
                                          .filter(Boolean)
                                          .join("\n");
                                        navigator.clipboard.writeText(
                                          fullAddress,
                                        );
                                        alert(
                                          "Shipping address copied to clipboard!",
                                        );
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                      Copy
                                    </button>
                                  </div>
                                  <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-line font-mono bg-white p-3 rounded border">
                                    {[
                                      order.shippingInfo.name,
                                      order.shippingInfo.phone,
                                      order.shippingInfo.address,
                                      order.shippingInfo.area +
                                        (order.shippingInfo.city
                                          ? `, ${order.shippingInfo.city}`
                                          : ""),
                                      order.shippingInfo.zipCode,
                                    ]
                                      .filter(Boolean)
                                      .join("\n")}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Payment & Additional Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-purple-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            Order Details
                          </h4>
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                            {order.paymentMethod && (
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                  Payment Method
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                                  {order.paymentMethod}
                                </p>
                              </div>
                            )}
                            {order.transactionId && (
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                  Transaction ID
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-sm font-mono font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                                    {order.transactionId}
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        order.transactionId,
                                      );
                                      toast.success("Transaction ID copied!");
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Copy Transaction ID"
                                  >
                                    <svg
                                      className="w-4 h-4 text-gray-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                                {order.paymentStatus ===
                                  "pending_verification" && (
                                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Payment verification pending
                                  </p>
                                )}
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wide">
                                Order Date
                              </span>
                              <p className="text-sm text-gray-900 mt-1">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                            {order.specialInstructions && (
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                  Special Instructions
                                </span>
                                <p className="text-sm text-gray-900 mt-1 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                  {order.specialInstructions}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h5 className="font-medium text-gray-900 mb-3">
                            Quick Actions
                          </h5>
                          <div className="space-y-2">
                            {/* Advance Payment Confirmation */}
                            {isAdvancePaymentPending(order) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedOrderForPayment(order);
                                  setShowPaymentModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium border border-yellow-200"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Confirm Advance Payment (৳{formatPrice(getAdvancePaymentInfo(order)?.amount || 0)})
                              </button>
                            )}

                            {/* Print Order Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                printOrder(order);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                              </svg>
                              Print Order Details
                            </button>

                            {order.shippingInfo?.phone && (
                              <a
                                href={`tel:${order.shippingInfo.phone}`}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                Call Customer
                              </a>
                            )}
                            {order.shippingInfo?.email && (
                              <a
                                href={`mailto:${order.shippingInfo.email}?subject=Order Update - ${order._id.slice(-8).toUpperCase()}`}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                Email Customer
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {showPaymentModal && selectedOrderForPayment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-200">
                <h3 className="text-lg font-bold text-gray-900">
                  💳 Confirm Advance Payment
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Order #{selectedOrderForPayment._id.slice(-8).toUpperCase()}
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Payment Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="text-lg font-bold text-gray-900">
                    {getAdvancePaymentInfo(selectedOrderForPayment)?.method || "bKash"}
                  </p>
                  <p className="text-sm text-gray-600 mt-3 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ৳{formatPrice(getAdvancePaymentInfo(selectedOrderForPayment)?.amount || 0)}
                  </p>
                </div>

                {/* Transaction ID Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID *
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID (e.g., TXN123456789)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                    disabled={confirmingPayment}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This ID will be recorded for audit trail
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>ℹ️ After confirmation:</strong> Order status will change to "Processing" and customer will be notified.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedOrderForPayment(null);
                    setTransactionId("");
                  }}
                  disabled={confirmingPayment}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdvancePayment}
                  disabled={confirmingPayment || !transactionId.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirmingPayment ? "Confirming..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
