import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  category: "Study" | "AI" | "Coding" | "Career" | "Interview" | "Security" | "Achievements" | "System";
  type: "reminder" | "system" | "ai";
  is_read: boolean;
  is_pinned?: boolean;
  created_at: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  toasts: ToastItem[];
  addToast: (title: string, message: string, type?: ToastItem["type"]) => void;
  removeToast: (id: string) => void;
  fetchNotifications: (cat?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  togglePinNotification: (id: string) => Promise<void>;
  triggerRecommendations: () => Promise<void>;
  logUserActivity: (type: string, desc: string) => Promise<void>;
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((title: string, message: string, type: ToastItem["type"] = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchNotifications = useCallback(async (cat?: string) => {
    if (!user) return;
    try {
      const url = cat ? `/api/notifications?category=${cat}` : "/api/notifications";
      const res = await api.get(url);
      setNotifications(res.data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
      addToast("Updated", "Notification marked as read.", "success");
    } catch (e) {
      addToast("Error", "Failed to update notification.", "error");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      addToast("Success", "All notifications marked as read.", "success");
    } catch (e) {
      addToast("Error", "Failed to clear notifications.", "error");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      addToast("Deleted", "Notification removed.", "success");
    } catch (e) {
      addToast("Error", "Failed to delete notification.", "error");
    }
  };

  const togglePinNotification = async (id: string) => {
    try {
      const res = await api.put(`/api/notifications/${id}/pin`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_pinned: res.data.is_pinned } : n))
      );
      addToast("Pinned", "Notification pin status updated.", "success");
    } catch (e) {
      addToast("Error", "Failed to pin notification.", "error");
    }
  };

  const triggerRecommendations = async () => {
    try {
      await api.post("/api/notifications/trigger");
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const logUserActivity = async (type: string, desc: string) => {
    try {
      await api.post("/api/notifications/activity", { type, description: desc });
    } catch (e) {
      console.error(e);
    }
  };

  // Poll for new notifications every 60 seconds if logged in
  useEffect(() => {
    if (user) {
      fetchNotifications();
      triggerRecommendations(); // Autocreate suggestions on mount
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        toasts,
        addToast,
        removeToast,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        togglePinNotification,
        triggerRecommendations,
        logUserActivity,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationsProvider");
  return context;
};
