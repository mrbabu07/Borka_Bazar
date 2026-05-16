import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import { auth } from "../firebase/firebase.config";

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window === "undefined") return "/api";
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

const getRealtimeApiUrl = () => {
  const configured = getApiUrl();
  if (configured && !configured.startsWith("/")) return configured;
  if (typeof window === "undefined") return configured;
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

const REALTIME_API_URL = getRealtimeApiUrl();
const NotificationContext = createContext();

const readJsonResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Expected JSON, received ${response.status}: ${text.slice(0, 120)}`,
    );
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed ${response.status}`);
  }

  return data;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

const normalizeNotification = (notification) => ({
  ...notification,
  id: notification.id || notification._id || `${Date.now()}-${Math.random()}`,
  timestamp:
    notification.timestamp ||
    notification.createdAt ||
    new Date().toISOString(),
  read: Boolean(notification.read),
});

const getDeletedNotificationIds = (userId) => {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(`deleted_notifications_${userId}`) || "[]");
  } catch {
    localStorage.removeItem(`deleted_notifications_${userId}`);
    return [];
  }
};

const saveDeletedNotificationIds = (userId, ids) => {
  if (!userId) return;
  localStorage.setItem(
    `deleted_notifications_${userId}`,
    JSON.stringify([...new Set(ids)].slice(-500)),
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setNotifications([]);
      setConnected(false);
    });
  }, []);

  const saveLocal = (userId, items) => {
    if (!userId) return;
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(items));
  };

  const mergeNotifications = useCallback((incoming) => {
    setNotifications((current) => {
      const deletedIds = new Set(getDeletedNotificationIds(currentUser?.uid));
      const map = new Map();
      [...incoming.map(normalizeNotification), ...current].forEach((item) => {
        if (deletedIds.has(item.id)) return;
        map.set(item.id, item);
      });
      const merged = Array.from(map.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 60);
      saveLocal(currentUser?.uid, merged);
      return merged;
    });
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser) return undefined;

    let closed = false;
    let syncInterval;
    let reconnectTimer;
    let eventSource;

    async function loadRemoteNotifications(token) {
      try {
        const response = await fetch(`${REALTIME_API_URL}/notifications/in-app`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await readJsonResponse(response);
        if (data.success && Array.isArray(data.data)) {
          mergeNotifications(data.data);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    }

    async function connect() {
      const saved = localStorage.getItem(`notifications_${currentUser.uid}`);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved).map(normalizeNotification));
        } catch {
          localStorage.removeItem(`notifications_${currentUser.uid}`);
        }
      }

      const token = await currentUser.getIdToken();
      await loadRemoteNotifications(token);

      syncInterval = window.setInterval(async () => {
        const freshToken = await currentUser.getIdToken();
        await loadRemoteNotifications(freshToken);
      }, 10000);

      if (closed) return;

      const connectStream = async () => {
        if (closed) return;

        const streamToken = await currentUser.getIdToken();
        eventSource = new EventSource(
          `${REALTIME_API_URL}/notifications/stream?token=${encodeURIComponent(streamToken)}`,
        );

        eventSource.addEventListener("connected", () => setConnected(true));
        eventSource.addEventListener("notification", (event) => {
          try {
            const notification = normalizeNotification(JSON.parse(event.data));
            mergeNotifications([notification]);
            toast(notification.title, { duration: 4500 });
          } catch (error) {
            console.error("Failed to parse realtime notification:", error);
          }
        });
        eventSource.onerror = async () => {
          setConnected(false);
          eventSource?.close();
          const freshToken = await currentUser.getIdToken().catch(() => null);
          if (freshToken) await loadRemoteNotifications(freshToken);
          if (!closed) {
            reconnectTimer = window.setTimeout(connectStream, 3000);
          }
        };
      };

      connectStream();
    }

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (syncInterval) window.clearInterval(syncInterval);
      if (eventSource) eventSource.close();
      setConnected(false);
    };
  }, [currentUser, mergeNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const addNotification = (notification) => {
    mergeNotifications([notification]);
  };

  const markAsRead = async (id) => {
    setNotifications((current) => {
      const updated = current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      );
      saveLocal(currentUser?.uid, updated);
      return updated;
    });

    try {
      const token = await currentUser?.getIdToken();
      if (token) {
        await fetch(`${REALTIME_API_URL}/notifications/in-app/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Failed to mark notification read:", error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((current) => {
      const updated = current.map((item) => ({ ...item, read: true }));
      saveLocal(currentUser?.uid, updated);
      return updated;
    });

    try {
      const token = await currentUser?.getIdToken();
      if (token) {
        await fetch(`${REALTIME_API_URL}/notifications/in-app/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Failed to mark all notifications read:", error);
    }
  };

  const clearNotification = (id) => {
    const deletedIds = getDeletedNotificationIds(currentUser?.uid);
    saveDeletedNotificationIds(currentUser?.uid, [...deletedIds, id]);

    setNotifications((current) => {
      const updated = current.filter((item) => item.id !== id);
      saveLocal(currentUser?.uid, updated);
      return updated;
    });

    currentUser
      ?.getIdToken()
      .then((token) =>
        fetch(`${REALTIME_API_URL}/notifications/in-app/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
      .catch((error) => {
        console.error("Failed to delete notification:", error);
      });
  };

  const clearAllNotifications = () => {
    const ids = notifications.map((item) => item.id);
    const deletedIds = getDeletedNotificationIds(currentUser?.uid);
    saveDeletedNotificationIds(currentUser?.uid, [...deletedIds, ...ids]);

    setNotifications([]);
    if (currentUser?.uid) {
      localStorage.removeItem(`notifications_${currentUser.uid}`);
    }

    currentUser
      ?.getIdToken()
      .then((token) =>
        fetch(`${REALTIME_API_URL}/notifications/in-app`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
      .catch((error) => {
        console.error("Failed to delete all notifications:", error);
      });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
