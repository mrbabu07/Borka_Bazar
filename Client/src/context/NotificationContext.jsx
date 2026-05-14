import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import { auth } from "../firebase/firebase.config";

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window === "undefined") return "/api";
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

const API_URL = getApiUrl();
const NotificationContext = createContext();

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
      const map = new Map();
      [...incoming.map(normalizeNotification), ...current].forEach((item) => {
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

    let eventSource;
    let closed = false;
    let syncInterval;

    async function loadRemoteNotifications(token) {
      try {
        const response = await fetch(`${API_URL}/notifications/in-app`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
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

      eventSource = new EventSource(
        `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`,
      );

      eventSource.addEventListener("connected", () => setConnected(true));
      eventSource.addEventListener("notification", (event) => {
        const notification = normalizeNotification(JSON.parse(event.data));
        mergeNotifications([notification]);
        toast(notification.title, { duration: 4500 });
      });
      eventSource.onerror = () => setConnected(false);
    }

    connect();

    return () => {
      closed = true;
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
        await fetch(`${API_URL}/notifications/in-app/${id}/read`, {
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
        await fetch(`${API_URL}/notifications/in-app/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Failed to mark all notifications read:", error);
    }
  };

  const clearNotification = (id) => {
    setNotifications((current) => {
      const updated = current.filter((item) => item.id !== id);
      saveLocal(currentUser?.uid, updated);
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (currentUser?.uid) {
      localStorage.removeItem(`notifications_${currentUser.uid}`);
    }
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
