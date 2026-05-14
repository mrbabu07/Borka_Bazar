import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Clock3,
  CreditCard,
  Headphones,
  Home,
  Layers3,
  Megaphone,
  Package,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TicketPercent,
  Truck,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  getAllOrders,
  getCategories,
  getPendingDeliveryPayments,
  getProducts,
} from "../../services/api";
import { useCurrency } from "../../hooks/useCurrency";

const timeframeOptions = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const quickActions = [
  {
    title: "Add Product",
    subtitle: "Create a new catalog item",
    to: "/admin/products/add",
    icon: Plus,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    title: "Verify Payments",
    subtitle: "Confirm bKash/Nagad delivery fees",
    to: "/admin/orders",
    icon: WalletCards,
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    title: "Print Parcels",
    subtitle: "Open orders and print receipts",
    to: "/admin/orders",
    icon: ReceiptText,
    tone: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    title: "Update Delivery",
    subtitle: "Fees, methods, and delivery days",
    to: "/admin/delivery-settings",
    icon: Truck,
    tone: "bg-violet-50 text-violet-700 border-violet-100",
  },
];

const managementSections = [
  {
    title: "Store",
    items: [
      { label: "Products", to: "/admin/products", icon: Package },
      { label: "Categories", to: "/admin/categories", icon: Layers3 },
      { label: "Inventory", to: "/admin/inventory", icon: Boxes },
      { label: "Flash Sales", to: "/admin/flash-sales", icon: Zap },
    ],
  },
  {
    title: "Orders",
    items: [
      { label: "Orders", to: "/admin/orders", icon: ClipboardList },
      { label: "Returns", to: "/admin/returns", icon: RefreshCcw },
      { label: "Coupons", to: "/admin/coupons", icon: TicketPercent },
      { label: "Offers", to: "/admin/offers", icon: Megaphone },
    ],
  },
  {
    title: "Customers",
    items: [
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "Reviews", to: "/admin/reviews", icon: Star },
      { label: "Q&A", to: "/admin/qa", icon: Search },
      { label: "Support", to: "/admin/support", icon: Headphones },
    ],
  },
  {
    title: "Growth",
    items: [
      { label: "Insights", to: "/admin/insights", icon: BarChart3 },
      { label: "Delivery", to: "/admin/delivery-settings", icon: Settings },
    ],
  },
];

const statusStyles = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
};

function getOrdersFromResponse(response) {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(response?.data?.orders)) return response.data.orders;
  return [];
}

function getOrderTotal(order) {
  return Number(order.totalAmount || order.total || order.grandTotal || 0);
}

function getOrderStatus(order) {
  return order.orderStatus || order.status || "pending";
}

function getCustomerName(order) {
  return (
    order.shippingInfo?.name ||
    order.customer?.name ||
    order.user?.name ||
    order.userName ||
    "Customer"
  );
}

function getOrderId(order) {
  return order.orderCode || order._id?.slice?.(-8)?.toUpperCase() || "ORDER";
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {children}
    </section>
  );
}

function KpiCard({ title, value, helper, icon: Icon, tone }) {
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helper}</p>
        </div>
        <div className={`rounded-lg border p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
      {text}
    </div>
  );
}

export default function AdminDashboard() {
  const { formatPrice } = useCurrency();
  const [timeframe, setTimeframe] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [productsRes, categoriesRes, ordersRes, pendingRes] =
          await Promise.all([
            getProducts(),
            getCategories(),
            getAllOrders(),
            getPendingDeliveryPayments().catch(() => ({ data: { data: [] } })),
          ]);

        if (ignore) return;
        setProducts(productsRes.data?.data || []);
        setCategories(categoriesRes.data?.data || []);
        setOrders(getOrdersFromResponse(ordersRes));
        setPendingPayments(getOrdersFromResponse(pendingRes));
      } catch (err) {
        if (!ignore) {
          setError("Dashboard data could not be loaded. Please refresh.");
          console.error("Failed to load admin dashboard:", err);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const days = Number(timeframe.replace("d", ""));
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const scopedOrders = orders.filter(
      (order) => new Date(order.createdAt || order.createdAtDate || 0) >= start,
    );

    const revenue = scopedOrders.reduce(
      (sum, order) => sum + getOrderTotal(order),
      0,
    );
    const dueCod = scopedOrders.reduce(
      (sum, order) => sum + Number(order.dueAmount || 0),
      0,
    );
    const delivered = scopedOrders.filter(
      (order) => getOrderStatus(order) === "delivered",
    ).length;
    const processing = scopedOrders.filter((order) =>
      ["confirmed", "processing", "shipped"].includes(getOrderStatus(order)),
    ).length;
    const uniqueCustomers = new Set(
      scopedOrders.map(
        (order) =>
          order.userId ||
          order.user ||
          order.shippingInfo?.email ||
          order.shippingInfo?.phone,
      ),
    ).size;

    return {
      revenue,
      dueCod,
      delivered,
      processing,
      uniqueCustomers,
      orders: scopedOrders.length,
      averageOrderValue: scopedOrders.length ? revenue / scopedOrders.length : 0,
    };
  }, [orders, timeframe]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
        .slice(0, 6),
    [orders],
  );

  const priorityItems = [
    {
      title: "Delivery payments waiting",
      value: pendingPayments.length,
      helper: "Confirm or reject manual bKash/Nagad payments",
      to: "/admin/orders",
      icon: CreditCard,
      tone: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      title: "Orders in progress",
      value: dashboardStats.processing,
      helper: "Confirmed, processing, and shipped orders",
      to: "/admin/orders",
      icon: Clock3,
      tone: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      title: "COD to collect",
      value: formatPrice(dashboardStats.dueCod),
      helper: "Remaining due amount from selected period",
      to: "/admin/orders",
      icon: ShoppingBag,
      tone: "bg-rose-50 text-rose-700 border-rose-100",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/"
                className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-950 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Back to home"
              >
                <Home className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
                    Admin Dashboard
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Live
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Manage orders, delivery payments, products, customers, and
                  parcel-ready receipts from one clean workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
                {timeframeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTimeframe(option.value)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      timeframe === option.value
                        ? "bg-white text-gray-950 shadow-sm dark:bg-gray-950 dark:text-white"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Link
                to="/admin/products/add"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Revenue"
            value={loading ? "..." : formatPrice(dashboardStats.revenue)}
            helper={`${timeframeOptions.find((item) => item.value === timeframe)?.label} total`}
            icon={BarChart3}
            tone="bg-emerald-50 text-emerald-700 border-emerald-100"
          />
          <KpiCard
            title="Orders"
            value={loading ? "..." : dashboardStats.orders.toLocaleString()}
            helper={`${dashboardStats.delivered} delivered`}
            icon={ClipboardList}
            tone="bg-blue-50 text-blue-700 border-blue-100"
          />
          <KpiCard
            title="Products"
            value={loading ? "..." : products.length.toLocaleString()}
            helper={`${categories.length} categories`}
            icon={Package}
            tone="bg-violet-50 text-violet-700 border-violet-100"
          />
          <KpiCard
            title="Average Order"
            value={
              loading ? "..." : formatPrice(dashboardStats.averageOrderValue)
            }
            helper={`${dashboardStats.uniqueCustomers} customers`}
            icon={Users}
            tone="bg-amber-50 text-amber-700 border-amber-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    Priority Queue
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Start here for the work that needs admin action.
                  </p>
                </div>
                <Link
                  to="/admin/orders"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-950 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
                >
                  Open orders
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {priorityItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      to={item.to}
                      className="rounded-lg border border-gray-200 p-4 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:hover:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-950 dark:text-white">
                            {item.title}
                          </p>
                          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
                            {loading ? "..." : item.value}
                          </p>
                        </div>
                        <div className={`rounded-lg border p-2.5 ${item.tone}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        {item.helper}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    Quick Actions
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Common admin tasks, one tap away.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      to={action.to}
                      className="group rounded-lg border border-gray-200 p-4 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:hover:border-gray-700"
                    >
                      <div
                        className={`mb-4 inline-flex rounded-lg border p-3 ${action.tone}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-950 dark:text-white">
                            {action.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {action.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-950 dark:group-hover:text-white" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                  Management Center
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Organized shortcuts for every part of the store.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {managementSections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {section.title}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                          >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              <Icon className="h-4 w-4" />
                            </span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-950 px-5 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold">Payment Verification</h2>
                    <p className="text-sm text-gray-300">
                      Delivery fee payments awaiting review
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-4xl font-bold text-gray-950 dark:text-white">
                  {loading ? "..." : pendingPayments.length}
                </p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Confirm valid transaction IDs before processing parcels.
                </p>
                <Link
                  to="/admin/orders"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                >
                  Review Pending Payments
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    Recent Orders
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Latest activity</p>
                </div>
                <Link
                  to="/admin/orders"
                  className="text-sm font-semibold text-gray-950 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
                >
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
                    />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <EmptyState text="No orders yet" />
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const status = getOrderStatus(order);
                    return (
                      <Link
                        key={order._id}
                        to="/admin/orders"
                        className="block rounded-lg border border-gray-200 p-3 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-950 dark:text-white">
                              #{getOrderId(order)}
                            </p>
                            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                              {getCustomerName(order)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                              statusStyles[status] ||
                              "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-950 dark:text-white">
                            {formatPrice(getOrderTotal(order))}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
