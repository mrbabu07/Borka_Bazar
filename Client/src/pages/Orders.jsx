import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { getUserOrders } from "../services/api";
import { useCurrency } from "../hooks/useCurrency";
import Loading from "../components/Loading";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "rejected", label: "Rejected" },
  { key: "delivered", label: "Delivered" },
];

const TIMELINE = [
  { key: "placed", label: "Placed", icon: Clock },
  { key: "confirmed", label: "Payment Confirmed", icon: CreditCard },
  { key: "processing", label: "Processing", icon: PackageCheck },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

const normalize = (value, fallback = "pending") =>
  (value || fallback).toString().toLowerCase();

const getOrderStatus = (order) =>
  normalize(order.orderStatus || order.order?.status || order.status);

const getPaymentStatus = (order) =>
  normalize(
    order.deliveryPaymentStatus ||
      order.advancePayment?.status ||
      order.payment?.advance?.status ||
      order.paymentInfo?.status,
  );

const getDisplayStatus = (order) => {
  const paymentStatus = getPaymentStatus(order);
  if (paymentStatus === "rejected") return "rejected";
  return getOrderStatus(order);
};

const statusClasses = {
  pending:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-200 dark:border-yellow-800",
  confirmed:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800",
  rejected:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800",
  processing:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800",
  shipped:
    "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-800",
  delivered:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800",
  cancelled:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800",
};

function StatusBadge({ value }) {
  const status = normalize(value);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${
        statusClasses[status] || statusClasses.pending
      }`}
    >
      {status}
    </span>
  );
}

function getItems(order) {
  return order.orderItems || order.products || [];
}

function getTotals(order) {
  const total =
    order.totalAmount ?? order.totalPrice ?? order.pricing?.total ?? order.total ?? 0;
  const deliveryFee =
    order.deliveryFee ?? order.deliveryCharge ?? order.pricing?.deliveryFee ?? 0;
  const paid = order.paidAmount ?? deliveryFee;
  const due =
    order.dueAmount ??
    order.pricing?.remainingAmount ??
    Math.max(total - deliveryFee, 0);

  return { total, deliveryFee, paid, due };
}

function timelineIndex(order) {
  const paymentStatus = getPaymentStatus(order);
  const orderStatus = getOrderStatus(order);

  if (paymentStatus === "rejected" || orderStatus === "rejected") return -1;
  if (orderStatus === "delivered") return 4;
  if (orderStatus === "shipped") return 3;
  if (orderStatus === "processing") return 2;
  if (paymentStatus === "confirmed" || orderStatus === "confirmed") return 1;
  return 0;
}

function getRejectionReason(order) {
  return (
    order.rejectionReason ||
    order.deliveryPayment?.rejectionReason ||
    order.advancePayment?.rejectionReason ||
    order.payment?.advance?.rejectionReason ||
    order.admin?.rejectionReason ||
    "Your delivery payment was rejected. Please contact support or place the order again with correct payment information."
  );
}

function extractOrders(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getUserOrders();
        setOrders(extractOrders(response.data));
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();

    return orders.filter((order) => {
      const displayStatus = getDisplayStatus(order);
      const paymentStatus = getPaymentStatus(order);
      const orderId = (order.orderCode || order._id || "").toLowerCase();
      const trx = (
        order.transactionId ||
        order.advancePayment?.transactionId ||
        ""
      ).toLowerCase();
      const matchesFilter =
        filter === "all" ||
        displayStatus === filter ||
        (filter === "confirmed" && paymentStatus === "confirmed") ||
        (filter === "rejected" && paymentStatus === "rejected");
      const matchesSearch = !search || orderId.includes(search) || trx.includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [filter, orders, query]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-stone-50 text-gray-950 dark:bg-gray-950 dark:text-gray-100">
      <div className="border-b border-stone-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-gold-500">
            Account
          </p>
          <h1 className="font-display text-3xl text-gray-950 dark:text-white md:text-4xl">
            My Orders
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Track delivery-fee verification, rejected payments, delivery progress,
            and cash due on delivery.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 w-full rounded-lg border border-stone-200 bg-white pl-12 pr-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              placeholder="Search by order ID or transaction ID"
            />
          </div>

          <div className="flex overflow-x-auto rounded-lg border border-stone-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`h-10 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition ${
                  filter === item.key
                    ? "bg-gray-950 text-white shadow-sm dark:bg-white dark:text-gray-950"
                    : "text-gray-600 hover:bg-stone-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <PackageCheck className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-700" />
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">
              No orders found
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your matching orders will appear here after checkout.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gray-950 px-6 text-sm font-bold text-white transition hover:bg-gold-500 dark:bg-white dark:text-gray-950 dark:hover:bg-gold-500 dark:hover:text-white"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const items = getItems(order);
              const totals = getTotals(order);
              const paymentStatus = getPaymentStatus(order);
              const displayStatus = getDisplayStatus(order);
              const orderId = order.orderCode || order._id?.slice(-8)?.toUpperCase();
              const isOpen = expanded[order._id];
              const activeStep = timelineIndex(order);
              const isRejected = displayStatus === "rejected";

              return (
                <article
                  key={order._id}
                  className={`overflow-hidden rounded-lg border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${
                    isRejected
                      ? "border-red-200 dark:border-red-900/70"
                      : "border-stone-200 dark:border-gray-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((current) => ({
                        ...current,
                        [order._id]: !current[order._id],
                      }))
                    }
                    className="w-full text-left"
                  >
                    <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                            Order #{orderId}
                          </h2>
                          <StatusBadge value={paymentStatus} />
                          <StatusBadge value={displayStatus} />
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </span>
                          {order.transactionId && (
                            <span className="font-mono">TRX {order.transactionId}</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:min-w-[520px]">
                        <SummaryBox label="Total" value={formatPrice(totals.total)} />
                        <SummaryBox
                          label={isRejected ? "Payment Rejected" : "Delivery Paid"}
                          value={formatPrice(totals.paid)}
                          tone={isRejected ? "red" : "green"}
                        />
                        <SummaryBox
                          label="Due on Delivery"
                          value={formatPrice(totals.due)}
                          tone="orange"
                        />
                        <div className="flex items-center justify-center rounded-lg bg-stone-50 p-3 dark:bg-gray-800">
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-stone-100 p-5 dark:border-gray-800">
                        {isRejected ? (
                          <RejectedNotice reason={getRejectionReason(order)} />
                        ) : (
                          <OrderTimeline activeStep={activeStep} />
                        )}

                        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                          <div className="space-y-3">
                            {items.map((item, index) => (
                              <OrderItem
                                key={`${order._id}-${item.productId || index}`}
                                item={item}
                                formatPrice={formatPrice}
                              />
                            ))}
                          </div>

                          <PaymentSummary
                            order={order}
                            totals={totals}
                            isRejected={isRejected}
                            formatPrice={formatPrice}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryBox({ label, value, tone = "neutral" }) {
  const classes = {
    neutral: "bg-stone-50 dark:bg-gray-800 text-gray-950 dark:text-white",
    green:
      "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200",
    red: "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200",
    orange:
      "bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200",
  };

  return (
    <div className={`rounded-lg p-3 ${classes[tone]}`}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function RejectedNotice({ reason }) {
  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/30">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-600 dark:bg-red-950 dark:text-red-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-red-900 dark:text-red-100">
            Delivery payment rejected
          </h3>
          <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-200">
            {reason}
          </p>
          <Link
            to="/support"
            className="mt-3 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ activeStep }) {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-5">
      {TIMELINE.map((step, index) => {
        const Icon = step.icon;
        const done = index <= activeStep;
        return (
          <div
            key={step.key}
            className={`rounded-lg border p-3 transition ${
              done
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/70 dark:bg-green-950/30 dark:text-green-200"
                : "border-stone-200 bg-stone-50 text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-500"
            }`}
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-900">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold">{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function OrderItem({ item, formatPrice }) {
  const color =
    typeof item.color === "string" ? item.color : item.color?.name || item.color?.label;

  return (
    <div className="flex gap-4 rounded-lg border border-stone-100 bg-stone-50 p-3 dark:border-gray-800 dark:bg-gray-950/60">
      <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-md bg-white dark:bg-gray-900">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title || item.name || "Product"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-950 dark:text-white">
          {item.title || item.name || "Product"}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Qty {item.quantity || 1}
          {item.size ? ` - Size ${item.size}` : ""}
          {color ? ` - ${color}` : ""}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          {formatPrice((item.price || 0) * (item.quantity || 1))}
        </p>
      </div>
    </div>
  );
}

function PaymentSummary({ order, totals, isRejected, formatPrice }) {
  const transactionId =
    order.transactionId ||
    order.advancePayment?.transactionId ||
    order.payment?.advance?.transactionId ||
    "Not provided";
  const senderNumber =
    order.senderNumber ||
    order.advancePayment?.senderNumber ||
    order.payment?.advance?.senderNumber ||
    "Not provided";

  return (
    <aside className="rounded-lg border border-stone-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-950 dark:text-white">
        Payment Summary
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Total amount</span>
          <span className="font-bold">{formatPrice(totals.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Delivery fee paid</span>
          <span
            className={`font-bold ${
              isRejected
                ? "text-red-700 dark:text-red-300"
                : "text-green-700 dark:text-green-300"
            }`}
          >
            {formatPrice(totals.deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-950/30">
          <span className="font-bold text-orange-800 dark:text-orange-200">
            Due amount
          </span>
          <span className="font-bold text-orange-800 dark:text-orange-200">
            {formatPrice(totals.due)}
          </span>
        </div>
        <div className="border-t border-stone-100 pt-3 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Transaction ID</p>
          <p className="mt-1 break-all font-mono font-bold text-gray-950 dark:text-white">
            {transactionId}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Sender number</p>
          <p className="mt-1 font-bold text-gray-950 dark:text-white">
            {senderNumber}
          </p>
        </div>
      </div>
    </aside>
  );
}
