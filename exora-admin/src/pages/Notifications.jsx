import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, CheckCircle2, ArrowRight, Loader2, XCircle } from "lucide-react";
import api from "../api/axios";

const Notifications = () => {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notification fetch error", err);
      setError(err.response?.data?.error || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [location.pathname]);

  const markAsRead = async (id) => {
    setMarking(id);
    try {
      const token = localStorage.getItem("token");
      await api.patch(
        `/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Mark read failed", err);
    } finally {
      setMarking(null);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setMarking("all");
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/notifications/mark-all-read",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );
    } catch (err) {
      console.error("Mark all read failed", err);
    } finally {
      setMarking(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
              : "All caught up! 🎉"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={marking === "all"}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-50"
            >
              {marking === "all" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Mark all as read
            </button>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <Bell size={18} className="text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">
              Latest updates
            </span>
            {unreadCount > 0 && (
              <span className="ml-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Loader2
              size={32}
              className="animate-spin mx-auto mb-3 text-indigo-600"
            />
            <p>Loading notifications...</p>
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to load notifications</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={loadNotifications}
                className="mt-3 text-sm text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={32} className="text-gray-400" />
          </div>
          <p className="text-xl font-semibold text-gray-700">
            No notifications yet
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Any important updates about your courses, payments, or exams will
            appear here.
          </p>
        </div>
      ) : (
        /* Notifications List */
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${
                notification.is_read
                  ? "border-gray-100 bg-gray-50/50"
                  : "border-indigo-200 bg-white shadow-sm"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                    )}
                    <h2
                      className={`text-lg font-semibold ${notification.is_read ? "text-gray-700" : "text-gray-900"}`}
                    >
                      {notification.title}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      notification.is_read
                        ? "bg-gray-100 text-gray-500"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {notification.is_read ? "Read" : "Unread"}
                  </span>
                  {notification.link && (
                    <a
                      href={notification.link}
                      className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:underline"
                    >
                      View
                      <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-400">
                <span>
                  {new Date(notification.created_at).toLocaleString()}
                </span>
                {!notification.is_read && (
                  <button
                    disabled={marking === notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-1.5 text-white text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {marking === notification.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={12} />
                    )}
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default Notifications;
