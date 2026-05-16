import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Database,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  deleteSingleCompletedOrder,
  getOrderCleanupCandidates,
} from "../../services/api";
import Loading from "../../components/Loading";
import { useCurrency } from "../../hooks/useCurrency";

const getOrderCode = (order) =>
  order.orderCode || order._id?.slice?.(-8)?.toUpperCase() || "ORDER";

const getStatus = (order) =>
  (order.orderStatus || order.status || order.order?.status || "unknown")
    .toString()
    .toLowerCase();

const getLifecycleDate = (order) =>
  order.deliveredAt || order.cancelledAt || order.createdAt || order.updatedAt;

const getCustomer = (order) => ({
  name: order.shippingInfo?.name || order.customer?.name || "Customer",
  phone: order.shippingInfo?.phone || order.customer?.phone || "No phone",
  email: order.shippingInfo?.email || order.customer?.email || "No email",
});

const getTotal = (order) => order.totalAmount ?? order.totalPrice ?? order.total ?? 0;

export default function AdminOrderCleanup() {
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState("");

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return orders;

    return orders.filter((order) => {
      const customer = getCustomer(order);
      return [
        order._id,
        order.orderCode,
        customer.name,
        customer.phone,
        customer.email,
        getStatus(order),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [orders, query]);

  const fetchCleanupOrders = async (page = pagination.page) => {
    setLoading(true);
    try {
      const response = await getOrderCleanupCandidates({
        days,
        page,
        limit: pagination.limit,
      });
      setOrders(response.data?.data?.orders || []);
      setPagination(response.data?.data?.pagination || pagination);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load cleanup orders",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleanupOrders(1);
  }, [days]);

  const handleDelete = async (order) => {
    const code = getOrderCode(order);
    const confirmText = window.prompt(
      `Delete order #${code} permanently?\nType DELETE ORDER to confirm.`,
    );

    if (confirmText !== "DELETE ORDER") {
      if (confirmText !== null) toast.error("Delete confirmation did not match");
      return;
    }

    setBusyOrder(order._id);
    const loadingToast = toast.loading(`Deleting order #${code}...`);

    try {
      const response = await deleteSingleCompletedOrder(order._id, confirmText);
      setOrders((current) => current.filter((item) => item._id !== order._id));
      setPagination((current) => ({
        ...current,
        total: Math.max(current.total - 1, 0),
      }));
      toast.success(response.data?.message || "Order deleted", {
        id: loadingToast,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete order", {
        id: loadingToast,
      });
    } finally {
      setBusyOrder("");
    }
  };

  if (loading) return <Loading />;

  return (
    <main className="min-h-screen bg-gray-50 font-body text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Toaster
        position="top-center"
        containerStyle={{
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />

      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/admin"
                className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-950 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Back to dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-red-500 sm:text-base">
                  Unusual Orders
                </p>
                <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-gray-950 dark:text-white sm:text-4xl lg:text-5xl">
                  Unusual / Old Order Cleanup
                </h1>
                <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-gray-600 dark:text-gray-300">
                  Delivered or cancelled orders older than {days} days load
                  here, including older migrated orders without a saved delivery
                  date. Delete one order at a time.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchCleanupOrders()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-base font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Retention
            </label>
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="mt-2 h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-base font-bold text-gray-800 outline-none transition focus:border-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-300"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Search Loaded Candidates
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-lg border border-gray-200 bg-white pl-12 pr-4 text-base font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-950 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300"
                placeholder="Order code, customer, phone, email, status"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-4 text-base font-medium leading-7 text-red-800 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              This page does not load active orders. It only loads cleanup
              candidates from the server: delivered orders older than {days}
              days and cancelled orders older than {days} days. Deleting is
              permanent and requires typing <strong>DELETE ORDER</strong>.
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-base font-semibold text-gray-600 dark:text-gray-300">
          <span>{pagination.total} eligible orders found</span>
          <span>
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <Database className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h2 className="font-display text-2xl font-bold text-gray-950 dark:text-white">
              No cleanup orders found
            </h2>
            <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
              There are no delivered or cancelled orders older than {days} days
              in this cleanup page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const customer = getCustomer(order);
              const lifecycleDate = getLifecycleDate(order);
              const status = getStatus(order);

              return (
                <article
                  key={order._id}
                  className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[minmax(0,1fr)_180px]"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-bold text-gray-950 dark:text-white">
                        #{getOrderCode(order)}
                      </h2>
                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-extrabold capitalize text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
                        {status}
                      </span>
                    </div>
                    <div className="grid gap-2 text-base font-medium text-gray-600 dark:text-gray-300 sm:grid-cols-2 lg:grid-cols-4">
                      <span className="truncate">{customer.name}</span>
                      <span className="truncate">{customer.phone}</span>
                      <span className="truncate">{customer.email}</span>
                      <span className="text-lg font-extrabold text-gray-950 dark:text-white">
                        {formatPrice(getTotal(order))}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                      <CalendarClock className="h-4 w-4" />
                      Lifecycle date:{" "}
                      {lifecycleDate
                        ? new Date(lifecycleDate).toLocaleString()
                        : "No date"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(order)}
                    disabled={busyOrder === order._id}
                    className="inline-flex h-12 items-center justify-center gap-2 self-center rounded-lg bg-red-600 px-5 text-base font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => fetchCleanupOrders(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-base font-bold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => fetchCleanupOrders(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-base font-bold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
