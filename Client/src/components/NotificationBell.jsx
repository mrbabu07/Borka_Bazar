import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Circle,
  CreditCard,
  PackageCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useClickOutside } from "../hooks/useClickOutside";

const typeStyles = {
  order_created: {
    icon: ShoppingBag,
    className: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  order_status: {
    icon: Truck,
    className: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  },
  payment_confirmed: {
    icon: CreditCard,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  payment_submitted: {
    icon: CreditCard,
    className: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  },
  payment_rejected: {
    icon: AlertTriangle,
    className: "bg-red-50 text-red-700 ring-red-100",
  },
  order_cancelled: {
    icon: X,
    className: "bg-rose-50 text-rose-700 ring-rose-100",
  },
  order_cleanup: {
    icon: Trash2,
    className: "bg-red-50 text-red-700 ring-red-100",
  },
  default: {
    icon: PackageCheck,
    className: "bg-slate-50 text-slate-700 ring-slate-100",
  },
};

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (Number.isNaN(date.getTime())) return "";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotifications();

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-gray-700 transition hover:border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:text-gray-200 dark:hover:border-gray-700 dark:hover:bg-gray-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <span
          className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${
            connected ? "bg-emerald-500" : "bg-gray-300"
          }`}
          title={connected ? "Realtime connected" : "Realtime reconnecting"}
        />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-950 dark:text-white">
                Notifications
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Orders, payment and admin updates
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-primary-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-300"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-8 py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  New order activity will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => {
                  const style =
                    typeStyles[notification.type] || typeStyles.default;
                  const Icon = style.icon;

                  return (
                    <div
                      key={notification.id}
                      className={`group px-4 py-3 transition ${
                        notification.read
                          ? "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/70"
                          : "bg-primary-50/70 hover:bg-primary-50 dark:bg-primary-950/30 dark:hover:bg-primary-950/45"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${style.className}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-950 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-300">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <Circle className="mt-1 h-2.5 w-2.5 shrink-0 fill-primary-600 text-primary-600" />
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatTime(notification.timestamp)}</span>
                            {!notification.read && (
                              <button
                                type="button"
                                onClick={() => markAsRead(notification.id)}
                                className="font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300"
                              >
                                Mark read
                              </button>
                            )}
                            {notification.link && (
                              <Link
                                to={notification.link}
                                onClick={() => {
                                  markAsRead(notification.id);
                                  setIsOpen(false);
                                }}
                                className="font-medium text-gray-800 hover:text-primary-700 dark:text-gray-100 dark:hover:text-primary-300"
                              >
                                View details
                              </Link>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => clearNotification(notification.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-red-950/40"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
