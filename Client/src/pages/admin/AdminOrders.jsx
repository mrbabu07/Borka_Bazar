import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  Database,
  Eye,
  Home,
  Mail,
  MapPin,
  Package,
  Phone,
  Printer,
  RefreshCcw,
  Search,
  Trash2,
  Truck,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  confirmDeliveryPayment,
  deleteDeliveredOrderCleanup,
  getAllOrders,
  previewDeliveredOrderCleanup,
  rejectDeliveryPayment,
  updateOrderStatus,
} from "../../services/api";
import { useCurrency } from "../../hooks/useCurrency";
import Loading from "../../components/Loading";
import { generateProfessionalInvoice } from "../../utils/printTemplate";

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const filters = [
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Payment Pending" },
  { value: "confirmed_payment", label: "Payment Confirmed" },
  { value: "rejected_payment", label: "Payment Rejected" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentBadge = {
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  rejected: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
};

const orderBadge = {
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  processing: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  shipped: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
  delivered: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200",
  cancelled: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
};

const normalize = (value, fallback = "pending") =>
  (value || fallback).toString().toLowerCase();

const getItems = (order) => order.orderItems || order.products || order.items || [];

const getResponseOrders = (response) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(response?.data?.orders)) return response.data.orders;
  return [];
};

const getTotals = (order) => {
  const total =
    order.totalAmount ??
    order.totalPrice ??
    order.pricing?.total ??
    order.total ??
    0;
  const deliveryFee =
    order.deliveryFee ??
    order.deliveryCharge ??
    order.pricing?.deliveryFee ??
    0;
  const paidAmount = order.paidAmount ?? deliveryFee;
  const dueAmount =
    order.dueAmount ??
    order.pricing?.remainingAmount ??
    Math.max(total - paidAmount, 0);

  return { total, deliveryFee, paidAmount, dueAmount };
};

const getOrderStatus = (order) =>
  normalize(order.orderStatus || order.order?.status || order.status);

const getPaymentStatus = (order) =>
  normalize(order.deliveryPaymentStatus || order.paymentInfo?.status);

const getOrderCode = (order) =>
  order.orderCode || order._id?.slice?.(-8)?.toUpperCase() || "ORDER";

const getCustomer = (order) => ({
  name: order.shippingInfo?.name || order.customer?.name || "Customer",
  phone: order.shippingInfo?.phone || order.customer?.phone || "No phone",
  email: order.shippingInfo?.email || order.customer?.email || "No email",
  address:
    [
      order.shippingInfo?.address || order.customer?.address,
      order.shippingInfo?.city,
      order.shippingInfo?.zipCode,
    ]
      .filter(Boolean)
      .join(", ") || "No address",
});

function Badge({ value, type = "payment" }) {
  const status = normalize(value);
  const styles = type === "order" ? orderBadge : paymentBadge;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
        styles[status] || styles.pending
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function StatCard({ title, value, helper, icon: Icon, tone }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helper}</p>
        </div>
        <div className={`rounded-lg border p-2.5 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("pending_payment");
  const [expanded, setExpanded] = useState({});
  const [busyOrder, setBusyOrder] = useState("");
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleanupPreview, setCleanupPreview] = useState(null);
  const [cleanupConfirm, setCleanupConfirm] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const { formatPrice } = useCurrency();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getAllOrders({ limit: 200 });
      setOrders(getResponseOrders(response));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to fetch orders",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const pendingPayment = orders.filter(
      (order) => getPaymentStatus(order) === "pending",
    ).length;
    const confirmedPayment = orders.filter(
      (order) => getPaymentStatus(order) === "confirmed",
    ).length;
    const processing = orders.filter((order) =>
      ["confirmed", "processing"].includes(getOrderStatus(order)),
    ).length;
    const shipped = orders.filter(
      (order) => getOrderStatus(order) === "shipped",
    ).length;
    const codDue = orders.reduce(
      (sum, order) => sum + Number(getTotals(order).dueAmount || 0),
      0,
    );

    return { pendingPayment, confirmedPayment, processing, shipped, codDue };
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const search = query.trim().toLowerCase();

    return orders
      .filter((order) => {
        const paymentStatus = getPaymentStatus(order);
        const orderStatus = getOrderStatus(order);

        if (activeFilter === "pending_payment") return paymentStatus === "pending";
        if (activeFilter === "confirmed_payment")
          return paymentStatus === "confirmed";
        if (activeFilter === "rejected_payment") return paymentStatus === "rejected";
        if (activeFilter === "processing")
          return ["confirmed", "processing"].includes(orderStatus);
        if (activeFilter === "shipped") return orderStatus === "shipped";
        if (activeFilter === "delivered") return orderStatus === "delivered";
        if (activeFilter === "cancelled")
          return orderStatus === "cancelled" || orderStatus === "canceled";
        return true;
      })
      .filter((order) => {
        if (!search) return true;
        const customer = getCustomer(order);
        const haystack = [
          order._id,
          order.orderCode,
          customer.name,
          customer.phone,
          customer.email,
          order.transactionId,
          order.senderNumber,
          order.receiverNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
  }, [activeFilter, orders, query]);

  const updateOrderLocally = (updatedOrder, orderId) => {
    setOrders((current) =>
      current.map((order) =>
        order._id === orderId ? { ...order, ...updatedOrder } : order,
      ),
    );
  };

  const handleConfirm = async (orderId) => {
    setBusyOrder(orderId);
    const loadingToast = toast.loading("Confirming delivery payment...");

    try {
      const response = await confirmDeliveryPayment(orderId);
      updateOrderLocally(response.data.data, orderId);
      toast.success("Payment confirmed and order moved to confirmed", {
        id: loadingToast,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to confirm payment", {
        id: loadingToast,
      });
    } finally {
      setBusyOrder("");
    }
  };

  const handleReject = async (orderId) => {
    setBusyOrder(orderId);
    const loadingToast = toast.loading("Rejecting delivery payment...");

    try {
      const response = await rejectDeliveryPayment(orderId);
      updateOrderLocally(response.data.data, orderId);
      toast.success("Payment rejected", { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject payment", {
        id: loadingToast,
      });
    } finally {
      setBusyOrder("");
    }
  };

  const handleStatusChange = async (orderId, status) => {
    setBusyOrder(orderId);
    const loadingToast = toast.loading("Updating order status...");

    try {
      const response = await updateOrderStatus(orderId, status);
      updateOrderLocally(response.data.data, orderId);
      toast.success("Order status updated", { id: loadingToast });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order", {
        id: loadingToast,
      });
    } finally {
      setBusyOrder("");
    }
  };

  const handlePrintReceipt = (order) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      toast.error("Popup blocked. Please allow popups to print receipts.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(generateProfessionalInvoice(order));
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handlePreviewCleanup = async () => {
    setCleanupLoading(true);
    try {
      const response = await previewDeliveredOrderCleanup(cleanupDays);
      setCleanupPreview(response.data.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to preview cleanup",
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleDeleteCleanup = async () => {
    if (cleanupConfirm !== "DELETE DELIVERED ORDERS") {
      toast.error("Type DELETE DELIVERED ORDERS to confirm");
      return;
    }

    setCleanupLoading(true);
    const loadingToast = toast.loading("Deleting old delivered orders...");

    try {
      const response = await deleteDeliveredOrderCleanup(
        cleanupDays,
        cleanupConfirm,
      );
      toast.success(response.data.message || "Old delivered orders deleted", {
        id: loadingToast,
      });
      setCleanupConfirm("");
      setCleanupPreview(null);
      await fetchOrders();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete delivered orders",
        { id: loadingToast },
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Toaster
        position="top-center"
        containerStyle={{
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />

      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/admin"
                className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-950 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Back to dashboard"
              >
                <Home className="h-5 w-5" />
              </Link>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                  Fulfillment
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
                  Admin Orders
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Verify delivery payments, update fulfillment status, and print
                  parcel receipts for COD delivery.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={fetchOrders}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("pending_payment")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
              >
                <WalletCards className="h-4 w-4" />
                Review Payments
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayment}
            helper="Needs confirm or reject"
            icon={AlertTriangle}
            tone="border-amber-100 bg-amber-50 text-amber-700"
          />
          <StatCard
            title="Confirmed Payments"
            value={stats.confirmedPayment}
            helper="Ready for fulfillment"
            icon={CheckCircle2}
            tone="border-emerald-100 bg-emerald-50 text-emerald-700"
          />
          <StatCard
            title="In Progress"
            value={stats.processing}
            helper="Confirmed and processing"
            icon={Truck}
            tone="border-blue-100 bg-blue-50 text-blue-700"
          />
          <StatCard
            title="Shipped"
            value={stats.shipped}
            helper="Dispatched parcels"
            icon={Truck}
            tone="border-indigo-100 bg-indigo-50 text-indigo-700"
          />
          <StatCard
            title="COD To Collect"
            value={formatPrice(stats.codDue)}
            helper="Remaining due from customers"
            icon={Package}
            tone="border-orange-100 bg-orange-50 text-orange-700"
          />
        </div>

        <div className="sticky top-0 z-10 mb-6 rounded-lg border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-lg border border-gray-200 bg-white pl-12 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-300/10"
                placeholder="Search order ID, customer, phone, email, transaction ID, sender number"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeFilter === filter.value
                      ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-950 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-red-100 bg-white p-4 shadow-sm dark:border-red-900/60 dark:bg-gray-900">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-950 dark:text-white">
                  Delivered Order Cleanup
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
                  Delete only delivered orders older than the selected retention
                  period. Minimum retention is 30 days.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[140px_150px_minmax(220px,1fr)_160px] xl:min-w-[760px]">
              <select
                value={cleanupDays}
                onChange={(event) => {
                  setCleanupDays(Number(event.target.value));
                  setCleanupPreview(null);
                }}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-300"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>

              <button
                type="button"
                onClick={handlePreviewCleanup}
                disabled={cleanupLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>

              <input
                value={cleanupConfirm}
                onChange={(event) => setCleanupConfirm(event.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500"
                placeholder="Type DELETE DELIVERED ORDERS"
              />

              <button
                type="button"
                onClick={handleDeleteCleanup}
                disabled={
                  cleanupLoading ||
                  cleanupConfirm !== "DELETE DELIVERED ORDERS" ||
                  !cleanupPreview?.count
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Old
              </button>
            </div>
          </div>

          {cleanupPreview && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/30">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                  {cleanupPreview.count} delivered orders older than{" "}
                  {cleanupPreview.days} days match this cleanup rule.
                </p>
                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                  Cutoff:{" "}
                  {new Date(cleanupPreview.cutoffDate).toLocaleDateString()}
                </p>
              </div>
              {cleanupPreview.sampleOrders?.length > 0 && (
                <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                  Sample:{" "}
                  {cleanupPreview.sampleOrders
                    .map((order) => getOrderCode(order))
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        {visibleOrders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">No orders found</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Change the filter or search term to see more orders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const totals = getTotals(order);
              const items = getItems(order);
              const customer = getCustomer(order);
              const paymentStatus = getPaymentStatus(order);
              const orderStatus = getOrderStatus(order);
              const isOpen = expanded[order._id];
              const isBusy = busyOrder === order._id;

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                >
                  <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_520px]">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((current) => ({
                              ...current,
                              [order._id]: !current[order._id],
                            }))
                          }
                          className="inline-flex items-center gap-2 text-left text-lg font-bold text-gray-950 hover:text-gray-700 dark:text-white dark:hover:text-gray-200"
                        >
                          #{getOrderCode(order)}
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <Badge value={paymentStatus} />
                        <Badge value={orderStatus} type="order" />
                      </div>

                      <div className="grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-2 xl:grid-cols-4">
                        <span className="flex min-w-0 items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="truncate">{customer.phone}</span>
                        </span>
                        <span className="flex min-w-0 items-center gap-2">
                          <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="truncate">{customer.email}</span>
                        </span>
                        <span className="flex min-w-0 items-center gap-2 font-mono">
                          <CreditCard className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="truncate">
                            {order.transactionId || "No TRX"}
                          </span>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : "No date"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Total
                          </p>
                          <p className="mt-1 font-bold text-gray-950 dark:text-white">
                            {formatPrice(totals.total)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            Paid Delivery
                          </p>
                          <p className="mt-1 font-bold text-emerald-800 dark:text-emerald-100">
                            {formatPrice(totals.paidAmount)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950/40">
                          <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                            COD Due
                          </p>
                          <p className="mt-1 font-bold text-orange-800 dark:text-orange-100">
                            {formatPrice(totals.dueAmount)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-pink-50 p-3 dark:bg-pink-950/40">
                          <p className="text-xs font-semibold text-pink-700 dark:text-pink-300">
                            Sender
                          </p>
                          <p className="mt-1 truncate font-bold text-pink-900 dark:text-pink-100">
                            {order.senderNumber || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid content-start gap-3 sm:grid-cols-2">
                      <select
                        value={orderStatus}
                        onChange={(event) =>
                          handleStatusChange(order._id, event.target.value)
                        }
                        disabled={isBusy}
                        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold capitalize text-gray-800 outline-none transition focus:border-gray-950 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-300"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(order)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 transition hover:border-gray-950 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:border-gray-400 dark:hover:bg-gray-800"
                      >
                        <Printer className="h-4 w-4" />
                        Print Receipt
                      </button>

                      {paymentStatus === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReject(order._id)}
                            disabled={isBusy}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-950/40"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirm(order._id)}
                            disabled={isBusy}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirm
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((current) => ({
                              ...current,
                              [order._id]: !current[order._id],
                            }))
                          }
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:col-span-2"
                        >
                          <Eye className="h-4 w-4" />
                          {isOpen ? "Hide Details" : "View Details"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="grid gap-5 border-t border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div>
                          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Products
                          </h3>
                          {items.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                              No products found for this order.
                            </div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              {items.map((item, index) => (
                                <div
                                  key={`${order._id}-${item.productId || item._id || index}`}
                                  className="flex gap-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                                >
                                  <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                                    {(item.image || item.productImage) && (
                                      <img
                                        src={item.image || item.productImage}
                                        alt={item.title || item.name || "Product"}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-gray-950 dark:text-white">
                                      {item.title || item.name || "Product"}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                      Qty {item.quantity || 1} x{" "}
                                      {formatPrice(item.price || 0)}
                                    </p>
                                    {(item.size || item.selectedSize) && (
                                      <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        Size: {item.size || item.selectedSize}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <aside className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Customer & Payment
                          </h3>
                          <div className="space-y-4 text-sm">
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Customer</p>
                              <p className="font-bold text-gray-950 dark:text-white">
                                {customer.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">Address</p>
                              <p className="mt-1 flex gap-2 font-semibold text-gray-800 dark:text-gray-200">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                {customer.address}
                              </p>
                            </div>
                            <div className="rounded-lg bg-pink-50 p-3 dark:bg-pink-950/40">
                              <p className="text-pink-700 dark:text-pink-300">
                                Transaction ID
                              </p>
                              <p className="break-all font-mono font-bold text-pink-950 dark:text-pink-100">
                                {order.transactionId ||
                                  order.advancePayment?.transactionId ||
                                  "N/A"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-pink-50 p-3 dark:bg-pink-950/40">
                              <p className="text-pink-700 dark:text-pink-300">Sender Number</p>
                              <p className="font-bold text-pink-950 dark:text-pink-100">
                                {order.senderNumber ||
                                  order.payment?.advance?.senderNumber ||
                                  "N/A"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                              <p className="text-gray-500 dark:text-gray-400">Receiver Number</p>
                              <p className="font-bold text-gray-950 dark:text-white">
                                {order.receiverNumber || "N/A"}
                              </p>
                            </div>
                          </div>
                        </aside>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
