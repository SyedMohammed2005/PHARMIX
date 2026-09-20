"use client";

import {
  Bell,
  Check,
  CircleAlert,
  Info,
  LogOut,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardHeaderProps = {
  role: string;
};

type NotificationType =
  | "LOW_STOCK"
  | "STOCKOUT_RISK"
  | "EXPIRY_RISK"
  | "DEMAND_SPIKE"
  | "DEMAND_DROP"
  | "WEATHER_SIGNAL"
  | "FORECAST_UPDATE"
  | "PURCHASE_ALERT"
  | "SUPPLIER_ALERT"
  | "AUDIT_ALERT"
  | "AI_INSIGHT"
  | "SYSTEM";

type NotificationSeverity =
  | "CRITICAL"
  | "WARNING"
  | "INFO"
  | "SUCCESS";

type NotificationItem = {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  entity: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  success: boolean;
  data?: {
    notifications: NotificationItem[];
    unreadCount: number;
  };
};

export function DashboardHeader({
  role,
}: DashboardHeaderProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      setNotificationsLoading(true);

      const response = await fetch(
        "/api/notifications?limit=20",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return;
      }

      const result =
        (await response.json()) as NotificationsResponse;

      if (!result.success || !result.data) {
        return;
      }

      setNotifications(
        result.data.notifications,
      );

      setUnreadCount(
        result.data.unreadCount,
      );
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error,
      );
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(
      loadNotifications,
      30000,
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node,
        )
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  function getNotificationHref(
    notification: NotificationItem,
  ): string | null {
    const { type, entityId } =
      notification;

    switch (type) {
      case "LOW_STOCK":
        return "/inventory";

      case "STOCKOUT_RISK":
      case "DEMAND_SPIKE":
      case "DEMAND_DROP":
        return entityId
          ? `/products/${entityId}`
          : "/products";

      case "EXPIRY_RISK":
        return entityId
          ? `/batches/${entityId}`
          : "/batches";

      case "FORECAST_UPDATE":
        return "/predictions";

      case "AI_INSIGHT":
        return "/ai";

      case "AUDIT_ALERT":
        return "/audit-logs";

      case "PURCHASE_ALERT":
        return "/purchases";

      case "SUPPLIER_ALERT":
        return "/purchases";

      case "WEATHER_SIGNAL":
        return "/predictions";

      case "SYSTEM":
      default:
        return null;
    }
  }

  async function markAsRead(
    notificationId: string,
  ) {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      setUnreadCount((current) =>
        Math.max(current - 1, 0),
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error,
      );
    }
  }

  async function handleNotificationNavigation(
    notification: NotificationItem,
  ) {
    const href =
      getNotificationHref(notification);

    if (!notification.isRead) {
      await markAsRead(
        notification.id,
      );
    }

    if (href) {
      setNotificationOpen(false);
      router.push(href);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error,
      );
    }
  }

  function getSeverityIcon(
    severity: NotificationSeverity,
  ) {
    if (severity === "CRITICAL") {
      return (
        <CircleAlert
          size={17}
          className="text-red-600"
        />
      );
    }

    if (severity === "WARNING") {
      return (
        <CircleAlert
          size={17}
          className="text-orange-500"
        />
      );
    }

    if (severity === "SUCCESS") {
      return (
        <Check
          size={17}
          className="text-emerald-600"
        />
      );
    }

    return (
      <Info
        size={17}
        className="text-blue-600"
      />
    );
  }

  function getSeverityBackground(
    severity: NotificationSeverity,
  ) {
    if (severity === "CRITICAL") {
      return "bg-red-50";
    }

    if (severity === "WARNING") {
      return "bg-orange-50";
    }

    if (severity === "SUCCESS") {
      return "bg-emerald-50";
    }

    return "bg-blue-50";
  }

  function formatNotificationTime(
    createdAt: string,
  ) {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      },
    );
  }

  async function handleLogout() {
    try {
      setLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6 shadow-sm">
      {/* Page information */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Dashboard
        </h2>

        <p className="text-sm text-gray-500">
          Pharmacy management overview
        </p>
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-4">
        {/* Notification Center */}
        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() =>
              setNotificationOpen(
                (current) => !current,
              )
            }
            aria-label="Notifications"
            aria-expanded={
              notificationOpen
            }
            className="group relative rounded-xl p-2.5 text-gray-500 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <Bell
              size={21}
              className="transition-transform duration-200 group-hover:scale-110"
            />

            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notificationOpen && (
            <div className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/60">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                  </h3>

                  <p className="text-xs text-gray-500">
                    {unreadCount} unread
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={
                        markAllAsRead
                      }
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                    >
                      Mark all as read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationOpen(
                        false,
                      )
                    }
                    aria-label="Close notifications"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-[420px] overflow-y-auto">
                {notificationsLoading &&
                notifications.length === 0 ? (
                  <div className="flex items-center justify-center px-4 py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600" />
                  </div>
                ) : notifications.length ===
                  0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
                      <Bell
                        size={20}
                        className="text-emerald-600"
                      />
                    </div>

                    <p className="text-sm font-medium text-gray-900">
                      All caught up
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      No notifications right now.
                    </p>
                  </div>
                ) : (
                  notifications.map(
                    (notification) => {
                      const href =
                        getNotificationHref(
                          notification,
                        );

                      return (
                        <div
                          key={
                            notification.id
                          }
                          className={`border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 ${
                            !notification.isRead
                              ? "bg-emerald-50/30"
                              : "bg-white"
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Severity icon */}
                            <div
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getSeverityBackground(
                                notification.severity,
                              )}`}
                            >
                              {getSeverityIcon(
                                notification.severity,
                              )}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`text-sm ${
                                    !notification.isRead
                                      ? "font-semibold text-gray-900"
                                      : "font-medium text-gray-700"
                                  }`}
                                >
                                  {
                                    notification.title
                                  }
                                </p>

                                {!notification.isRead && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                )}
                              </div>

                              <p className="mt-1 text-xs leading-5 text-gray-600">
                                {
                                  notification.message
                                }
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-gray-400">
                                  {formatNotificationTime(
                                    notification.createdAt,
                                  )}
                                </span>

                                <div className="flex items-center gap-3">
                                  {!notification.isRead && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        markAsRead(
                                          notification.id,
                                        )
                                      }
                                      className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700"
                                    >
                                      Mark as read
                                    </button>
                                  )}

                                  {href && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleNotificationNavigation(
                                          notification,
                                        )
                                      }
                                      className="text-[11px] font-semibold text-gray-700 hover:text-emerald-600"
                                    >
                                      View details →
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3">
                <button
                  type="button"
                  onClick={() =>
                    setNotificationOpen(
                      false,
                    )
                  }
                  className="w-full text-center text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <div className="rounded-full bg-emerald-50 p-2">
            <User
              size={18}
              className="text-emerald-600"
            />
          </div>

          <span className="text-sm font-medium text-gray-700">
            {role}
          </span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut size={18} />

          {loading
            ? "Logging out..."
            : "Logout"}
        </button>
      </div>
    </header>
  );
}