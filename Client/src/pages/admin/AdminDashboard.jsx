import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  Database,
  Headphones,
  Home,
  Layers3,
  LifeBuoy,
  Megaphone,
  Package,
  PackageX,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TicketPercent,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  getAllOrders,
  getAllReturns,
  getCategories,
  getPendingDeliveryPayments,
  getProducts,
  getTicketStats,
  getUserStats,
} from "../../services/api";
import { useCurrency } from "../../hooks/useCurrency";
import { useNotifications } from "../../context/NotificationContext";

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
    badgeKey: "pendingPayments",
  },
  {
    title: "Print Parcels",
    subtitle: "Open orders and print receipts",
    to: "/admin/orders",
    icon: ReceiptText,
    tone: "bg-sky-50 text-sky-700 border-sky-100",
    badgeKey: "printReady",
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
      {
        label: "Inventory",
        to: "/admin/inventory",
        icon: Boxes,
        badgeKey: "stockAlerts",
      },
      { label: "Flash Sales", to: "/admin/flash-sales", icon: Zap },
    ],
  },
  {
    title: "Orders",
    items: [
      {
        label: "Orders",
        to: "/admin/orders",
        icon: ClipboardList,
        badgeKey: "pendingOrders",
      },
      {
        label: "Returns",
        to: "/admin/returns",
        icon: RefreshCcw,
        badgeKey: "pendingReturns",
      },
      {
        label: "Unusual Orders",
        to: "/admin/order-cleanup",
        icon: Database,
      },
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
      {
        label: "Support",
        to: "/admin/support",
        icon: Headphones,
        badgeKey: "openTickets",
      },
    ],
  },
  {
    title: "Growth",
    items: [
      { label: "Insights", to: "/admin/insights", icon: BarChart3 },
      { label: "Delivery", to: "/admin/delivery-settings", icon: Settings },
      { label: "Social Links", to: "/admin/social-settings", icon: Share2 },
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

function getArrayFromResponse(response) {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

function getObjectFromResponse(response) {
  return response?.data?.data || response?.data?.stats || response?.data || {};
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

function KpiCard({ title, value, helper, icon, tone }) {
  const IconComponent = icon;

  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helper}</p>
        </div>
        <div className={`rounded-lg border p-3 ${tone}`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function CountBadge({ value, tone = "bg-red-600 text-white" }) {
  if (!value) return null;
  const numericValue = Number(value);
  const display = numericValue > 99 ? "99+" : value;

  return (
    <span
      className={`inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none ${tone}`}
    >
      {display}
    </span>
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
  const { unreadCount, connected } = useNotifications();
  const [timeframe, setTimeframe] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [ticketStats, setTicketStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [
          productsRes,
          categoriesRes,
          ordersRes,
          pendingRes,
          returnsRes,
          ticketStatsRes,
          userStatsRes,
        ] =
          await Promise.all([
            getProducts(),
            getCategories(),
            getAllOrders(),
            getPendingDeliveryPayments().catch(() => ({ data: { data: [] } })),
            getAllReturns().catch(() => ({ data: { data: [] } })),
            getTicketStats().catch(() => ({ data: { stats: {} } })),
            getUserStats().catch(() => ({ data: { data: {} } })),
          ]);

        if (ignore) return;
        setProducts(getArrayFromResponse(productsRes));
        setCategories(getArrayFromResponse(categoriesRes));
        setOrders(getOrdersFromResponse(ordersRes));
        setPendingPayments(getOrdersFromResponse(pendingRes));
        setReturns(getArrayFromResponse(returnsRes));
        setTicketStats(getObjectFromResponse(ticketStatsRes));
        setUserStats(getObjectFromResponse(userStatsRes));
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
    const shipped = scopedOrders.filter(
      (order) => getOrderStatus(order) === "shipped",
    ).length;
    const processing = scopedOrders.filter((order) =>
      ["confirmed", "processing"].includes(getOrderStatus(order)),
    ).length;
    const pending = scopedOrders.filter(
      (order) => getOrderStatus(order) === "pending",
    ).length;
    const cancelled = scopedOrders.filter((order) =>
      ["cancelled", "rejected"].includes(getOrderStatus(order)),
    ).length;
    const printReady = orders.filter((order) =>
      ["confirmed", "processing"].includes(getOrderStatus(order)),
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
      shipped,
      processing,
      pending,
      cancelled,
      printReady,
      uniqueCustomers,
      orders: scopedOrders.length,
      averageOrderValue: scopedOrders.length ? revenue / scopedOrders.length : 0,
    };
  }, [orders, timeframe]);

  const inventoryStats = useMemo(() => {
    const lowStock = products.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;
    const outOfStock = products.filter(
      (product) => Number(product.stock || 0) === 0,
    ).length;
    const totalValue = products.reduce(
      (sum, product) =>
        sum +
        Number(product.price || product.discountPrice || 0) *
          Number(product.stock || 0),
      0,
    );

    return {
      lowStock,
      outOfStock,
      stockAlerts: lowStock + outOfStock,
      totalValue,
    };
  }, [products]);

  const pendingReturns = useMemo(
    () =>
      returns.filter((item) =>
        ["pending", "approved", "processing"].includes(item.status),
      ).length,
    [returns],
  );

  const openTickets = useMemo(() => {
    const statusStats = ticketStats.statusStats || [];
    if (Array.isArray(statusStats)) {
      return statusStats
        .filter((item) => ["open", "in_progress"].includes(item._id))
        .reduce((sum, item) => sum + Number(item.count || 0), 0);
    }
    return Number(ticketStats.open || 0) + Number(ticketStats.in_progress || 0);
  }, [ticketStats]);

  const totalUsers =
    Number(userStats.totalUsers || userStats.total || userStats.users || 0) || 0;

  const badgeCounts = {
    openTickets,
    pendingOrders: dashboardStats.pending,
    shippedOrders: dashboardStats.shipped,
    pendingPayments: pendingPayments.length,
    pendingReturns,
    printReady: dashboardStats.printReady,
    stockAlerts: inventoryStats.stockAlerts,
  };

  const pipelineItems = [
    { label: "Pending", value: dashboardStats.pending, color: "bg-amber-500" },
    { label: "In progress", value: dashboardStats.processing, color: "bg-blue-500" },
    { label: "Shipped", value: dashboardStats.shipped, color: "bg-indigo-500" },
    { label: "Delivered", value: dashboardStats.delivered, color: "bg-emerald-500" },
    { label: "Issues", value: dashboardStats.cancelled, color: "bg-red-500" },
  ];

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
      title: "Stock alerts",
      value: inventoryStats.stockAlerts,
      helper: `${inventoryStats.lowStock} low, ${inventoryStats.outOfStock} out of stock`,
      to: "/admin/inventory",
      icon: PackageX,
      tone: "bg-red-50 text-red-700 border-red-100",
    },
    {
      title: "Returns to handle",
      value: pendingReturns,
      helper: "Pending, approved, and processing return requests",
      to: "/admin/returns",
      icon: RefreshCcw,
      tone: "bg-violet-50 text-violet-700 border-violet-100",
    },
    {
      title: "Orders in progress",
      value: dashboardStats.processing,
      helper: "Confirmed and processing orders",
      to: "/admin/orders",
      icon: Clock3,
      tone: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      title: "Shipped orders",
      value: dashboardStats.shipped,
      helper: "Dispatched parcels waiting for delivery",
      to: "/admin/orders",
      icon: Truck,
      tone: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    {
      title: "Support waiting",
      value: openTickets,
      helper: "Open and in-progress customer tickets",
      to: "/admin/support",
      icon: LifeBuoy,
      tone: "bg-cyan-50 text-cyan-700 border-cyan-100",
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <BellRing className="h-3.5 w-3.5" />
                    {unreadCount} unread
                    <span
                      className={`h-2 w-2 rounded-full ${
                        connected ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
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

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Link
            to="/admin/orders"
            className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 transition hover:border-amber-300 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <Clock3 className="h-4 w-4" />
              Pending orders
            </span>
            <CountBadge value={dashboardStats.pending} tone="bg-amber-600 text-white" />
          </Link>
          <Link
            to="/admin/inventory"
            className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 transition hover:border-red-300 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <PackageX className="h-4 w-4" />
              Stock needs attention
            </span>
            <CountBadge value={inventoryStats.stockAlerts} />
          </Link>
          <Link
            to="/admin/support"
            className="flex items-center justify-between rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-900 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-100"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <LifeBuoy className="h-4 w-4" />
              Support queue
            </span>
            <CountBadge value={openTickets} tone="bg-cyan-700 text-white" />
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-900 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-100"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <Truck className="h-4 w-4" />
              Shipped orders
            </span>
            <CountBadge value={dashboardStats.shipped} tone="bg-indigo-700 text-white" />
          </Link>
          <Link
            to="/admin/returns"
            className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-violet-900 transition hover:border-violet-300 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-100"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <RefreshCcw className="h-4 w-4" />
              Active returns
            </span>
            <CountBadge value={pendingReturns} tone="bg-violet-700 text-white" />
          </Link>
        </div>

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
            helper={`${dashboardStats.shipped} shipped, ${dashboardStats.delivered} delivered`}
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
            helper={`${dashboardStats.uniqueCustomers} active${totalUsers ? `, ${totalUsers} total users` : ""}`}
            icon={UserCheck}
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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-950 dark:text-white">
                              {item.title}
                            </p>
                            <CountBadge
                              value={
                                typeof item.value === "number" ? item.value : 0
                              }
                            />
                          </div>
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
                  const badgeValue = badgeCounts[action.badgeKey] || 0;
                  return (
                    <Link
                      key={action.title}
                      to={action.to}
                      className="group rounded-lg border border-gray-200 p-4 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:hover:border-gray-700"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div
                          className={`inline-flex rounded-lg border p-3 ${action.tone}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <CountBadge value={badgeValue} />
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
                        const badgeValue = badgeCounts[item.badgeKey] || 0;
                        return (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="truncate">{item.label}</span>
                            </span>
                            <CountBadge value={badgeValue} />
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
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    Order Pipeline
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status count for the selected period
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {pipelineItems.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                      <span className="font-bold text-gray-950 dark:text-white">
                        {loading ? "..." : item.value}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{
                          width: `${Math.min(
                            100,
                            dashboardStats.orders
                              ? (item.value / dashboardStats.orders) * 100
                              : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    COD Due
                  </div>
                  <p className="text-sm font-bold text-gray-950 dark:text-white">
                    {loading ? "..." : formatPrice(dashboardStats.dueCod)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Print Ready
                  </div>
                  <p className="text-sm font-bold text-gray-950 dark:text-white">
                    {loading ? "..." : dashboardStats.printReady}
                  </p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/40">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    <Truck className="h-3.5 w-3.5" />
                    Shipped
                  </div>
                  <p className="text-sm font-bold text-indigo-950 dark:text-indigo-100">
                    {loading ? "..." : dashboardStats.shipped}
                  </p>
                </div>
              </div>
            </Card>

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
