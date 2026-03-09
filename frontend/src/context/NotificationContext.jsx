"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usersApi } from "@/lib/api";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { on } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await usersApi.getNotifications({ limit: 20 });
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    const cleanup = on("notification", (notif) => {
      // Add to list
      setNotifications((prev) => [
        { ...notif, _id: Date.now(), read: false, createdAt: new Date() },
        ...prev.slice(0, 19),
      ]);
      setUnreadCount((c) => c + 1);

      // Show toast
      const icons = {
        outbid: "⚡",
        won: "🏆",
        credits_assigned: "💰",
        auction_started: "🔔",
        lost: "😔",
      };
      const icon = icons[notif.type] || "🔔";
      toast(`${icon} ${notif.title}`, { duration: 6000 });
    });
    return cleanup;
  }, [on]);

  const markAllRead = async () => {
    try {
      await usersApi.markNotificationsRead({ all: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const markRead = async (ids) => {
    try {
      await usersApi.markNotificationsRead({ notificationIds: ids });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n._id) ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - ids.length));
    } catch {
      // silently fail
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAllRead,
        markRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
};
