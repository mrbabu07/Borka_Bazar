import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Info,
  Loader2,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import pushNotificationService, {
  NotificationTypes,
} from "../services/pushNotifications";
import useAuth from "../hooks/useAuth";

export default function NotificationSettings() {
  const { user } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    subscribed: false,
    permission: "default",
  });
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    [NotificationTypes.ORDER_STATUS]: true,
    [NotificationTypes.FLASH_SALE]: true,
    [NotificationTypes.BACK_IN_STOCK]: true,
    [NotificationTypes.ABANDONED_CART]: true,
    [NotificationTypes.WISHLIST_SALE]: true,
    [NotificationTypes.NEW_PRODUCT]: false,
    [NotificationTypes.REVIEW_REMINDER]: true,
  });

  const preferenceItems = useMemo(
    () => ({
      [NotificationTypes.ORDER_STATUS]: {
        title: "Order Updates",
        description: "Get notified when your order status changes",
      },
      [NotificationTypes.FLASH_SALE]: {
        title: "Flash Sale Alerts",
        description: "Be the first to know about limited-time offers",
      },
      [NotificationTypes.BACK_IN_STOCK]: {
        title: "Back in Stock",
        description: "Get notified when wishlist items are available",
      },
      [NotificationTypes.ABANDONED_CART]: {
        title: "Cart Reminders",
        description: "Reminders about items left in your cart",
      },
      [NotificationTypes.WISHLIST_SALE]: {
        title: "Wishlist Sales",
        description: "Get notified when wishlist items go on sale",
      },
      [NotificationTypes.NEW_PRODUCT]: {
        title: "New Products",
        description: "Updates about new products in your favorite categories",
      },
      [NotificationTypes.REVIEW_REMINDER]: {
        title: "Review Reminders",
        description: "Reminders to review your purchased products",
      },
    }),
    [],
  );

  const checkNotificationStatus = useCallback(async () => {
    const status = await pushNotificationService.getSubscriptionStatus();
    setNotificationStatus(status);
  }, []);

  const loadUserPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/user/notification-preferences", {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPreferences((prev) => ({ ...prev, ...data.data }));
        }
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
    }
  }, [user]);

  useEffect(() => {
    checkNotificationStatus();
    loadUserPreferences();
  }, [checkNotificationStatus, loadUserPreferences]);

  const saveUserPreferences = async (newPreferences) => {
    if (!user) return;

    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        console.log("Notification preferences saved");
      }
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const hasPermission = await pushNotificationService.requestPermission();

      if (hasPermission) {
        await pushNotificationService.subscribe();
        await checkNotificationStatus();
        pushNotificationService.showLocalNotification("Notifications Enabled", {
          body: "You'll now receive updates about your orders and special offers.",
          tag: "notification-enabled",
        });
      } else {
        alert(
          "Notifications are blocked. To enable them:\n\n" +
            "Chrome: Click the lock icon in address bar > Notifications > Allow\n" +
            "Firefox: Click shield icon > Permissions > Allow notifications\n" +
            "Edge: Click lock icon > Notifications > Allow\n\n" +
            "Then refresh the page and try again.",
        );
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);

      if (error.message.includes("blocked")) {
        alert(error.message);
      } else {
        alert(
          "Failed to enable notifications. Please check your browser settings and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      await pushNotificationService.unsubscribe();
      await checkNotificationStatus();
    } catch (error) {
      console.error("Failed to disable notifications:", error);
      alert("Failed to disable notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (type, enabled) => {
    const newPreferences = { ...preferences, [type]: enabled };
    setPreferences(newPreferences);
    await saveUserPreferences(newPreferences);
  };

  const testNotification = () => {
    pushNotificationService.showLocalNotification("Test Notification", {
      body: "This is a test notification from Dubai Borka Bazar Hnila.",
      tag: "test-notification",
    });
  };

  const getPermissionStatus = () => {
    switch (notificationStatus.permission) {
      case "granted":
        return {
          text: "Enabled",
          icon: CheckCircle2,
          className:
            "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/70",
        };
      case "denied":
        return {
          text: "Blocked",
          icon: XCircle,
          className:
            "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-800/70",
        };
      case "default":
        return {
          text: "Not Set",
          icon: AlertTriangle,
          className:
            "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800/70",
        };
      case "unsupported":
        return {
          text: "Not Supported",
          icon: BellOff,
          className:
            "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700",
        };
      default:
        return {
          text: "Unknown",
          icon: Info,
          className:
            "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700",
        };
    }
  };

  const statusInfo = getPermissionStatus();
  const StatusIcon = statusInfo.icon;

  if (!notificationStatus.supported) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700">
            <BellOff className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-950 dark:text-white">
            Notifications Not Supported
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your browser does not support push notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 bg-gray-50/80 p-6 dark:border-gray-800 dark:bg-gray-950/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100 dark:bg-primary-950/50 dark:text-primary-200 dark:ring-primary-800/70">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">
                Push Notifications
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Control browser alerts for orders, payments and offers.
              </p>
            </div>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${statusInfo.className}`}
          >
            <StatusIcon className="h-4 w-4" />
            {statusInfo.text}
            {notificationStatus.subscribed && (
              <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] dark:bg-black/20">
                Subscribed
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {notificationStatus.permission === "denied" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/80 dark:bg-red-950/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />
              <div>
                <h4 className="mb-2 text-sm font-semibold text-red-900 dark:text-red-100">
                  Notifications are blocked
                </h4>
                <p className="mb-3 text-sm text-red-700 dark:text-red-200">
                  Allow notifications in your browser settings, refresh this
                  page, then try again.
                </p>
                <div className="space-y-1 text-sm text-red-700 dark:text-red-200">
                  <div>
                    <strong>Chrome:</strong> Lock icon &gt; Notifications &gt;
                    Allow
                  </div>
                  <div>
                    <strong>Firefox:</strong> Shield icon &gt; Permissions &gt;
                    Allow notifications
                  </div>
                  <div>
                    <strong>Edge:</strong> Lock icon &gt; Notifications &gt;
                    Allow
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          {!notificationStatus.subscribed ? (
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Enable Notifications
                </>
              )}
            </button>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={testNotification}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <Send className="h-4 w-4" />
                Send test notification
              </button>
              <button
                onClick={handleDisableNotifications}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4" />
                    Disable notifications
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {notificationStatus.subscribed && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-950 dark:text-white">
                Notification Preferences
              </h3>
            </div>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {Object.entries(preferenceItems).map(([type, info]) => (
                <div
                  key={type}
                  className="flex items-center justify-between gap-4 bg-white p-4 transition hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/70"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-950 dark:text-white">
                      {info.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {info.description}
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={preferences[type]}
                      onChange={(event) =>
                        handlePreferenceChange(type, event.target.checked)
                      }
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-primary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:bg-gray-700 dark:peer-checked:bg-primary-500 dark:peer-focus:ring-primary-800" />
                    <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white transition peer-checked:translate-x-5 peer-checked:border-white" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/80 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
            <div>
              <h4 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-100">
                About Push Notifications
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Push notifications can arrive even when the app is closed. You
                can adjust each category or disable browser alerts anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
