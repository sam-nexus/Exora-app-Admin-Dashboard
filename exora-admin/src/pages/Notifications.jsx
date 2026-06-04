import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bell, CheckCircle2, ArrowRight, Loader2, XCircle,
  Filter, Send, Users, User, Megaphone, Plus, X,
} from "lucide-react";
import api from "../api/axios";

// ─── Send Notification Modal ──────────────────────────────────────────────────
const SendModal = ({ users, onClose, onSent }) => {
  const [mode, setMode]       = useState('single');   // 'single' | 'broadcast'
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink]       = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientRole, setRecipientRole] = useState('user');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }
    if (mode === 'single' && !recipientId) {
      setError('Please select a recipient.');
      return;
    }
    setSending(true);
    try {
      const payload = mode === 'broadcast'
        ? { title, message, link, broadcast: true, recipientRole }
        : { title, message, link, recipientId };
      await api.post('/notifications', payload);
      onSent();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Send size={18} />
            <h3 className="font-bold text-lg">Send Notification</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {/* mode toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button type="button" onClick={() => setMode('single')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${mode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
              <User size={15} /> Single User
            </button>
            <button type="button" onClick={() => setMode('broadcast')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${mode === 'broadcast' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
              <Megaphone size={15} /> Broadcast
            </button>
          </div>

          {/* recipient */}
          {mode === 'single' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none">
                <option value="">— Select a user —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send to role</label>
              <div className="flex gap-2">
                {[['user', '👨‍🎓 All Students'], ['admin', '👨‍💼 All Admins']].map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setRecipientRole(val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${recipientRole === val ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
          </div>

          {/* message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              rows={3} placeholder="Write your notification message..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none" />
          </div>

          {/* link (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link <span className="text-gray-400 text-xs">(optional)</span></label>
            <input value={link} onChange={(e) => setLink(e.target.value)}
              placeholder="/student/departments or /payments"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={sending}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? 'Sending…' : mode === 'broadcast' ? 'Broadcast' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const Notifications = () => {
  const location  = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [marking, setMarking]             = useState(null);
  const [filterType, setFilterType]       = useState("all");
  const [showSendModal, setShowSendModal] = useState(false);

  const isAdmin = localStorage.getItem('role') === 'admin';

  const notificationTypeLabels = {
    course_added:             "📚 Course Added",
    mock_exam_added:          "📝 Mock Exam",
    exit_exam_added:          "🎯 Exit Exam",
    course_unlocked:          "🔓 Course Unlocked",
    unlock_request_submitted: "⏳ Unlock Pending",
    unlock_request_rejected:  "❌ Unlock Rejected",
    system_announcement:      "📢 System",
    payment_reminder:         "💳 Payment",
    payment_received:         "💰 Payment Received",
    student_registered:       "👤 New Student",
    general:                  "📌 General",
  };

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get("/users");
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users for send modal", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, [location.pathname]);

  const markAsRead = async (id) => {
    setMarking(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error("Mark read failed", err);
    } finally {
      setMarking(null);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.filter((n) => !n.is_read).length === 0) return;
    setMarking("all");
    try {
      await api.post("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Mark all read failed", err);
    } finally {
      setMarking(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = filterType === "all"
    ? notifications
    : notifications.filter((n) => n.notification_type === filterType);

  // unique types present in notifications for filter bar
  const presentTypes = [...new Set(
    notifications.map((n) => n.notification_type).filter(Boolean)
  )];

  return (
    <div className="space-y-6">
      {/* Send modal */}
      {showSendModal && (
        <SendModal
          users={users}
          onClose={() => setShowSendModal(false)}
          onSent={loadNotifications}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            🔔 Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} disabled={marking === "all"}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-50">
              {marking === "all" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Mark all read
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowSendModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 text-sm font-semibold hover:shadow-md transition">
              <Plus size={15} /> Send Notification
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={36} className="animate-spin mx-auto mb-3 text-indigo-600" />
            <p className="text-sm text-gray-500">Loading notifications…</p>
          </div>
        </div>

      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Unable to load notifications</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button onClick={loadNotifications}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-red-700 font-semibold hover:underline">
                <Loader2 size={13} /> Try again
              </button>
            </div>
          </div>
        </div>

      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={32} className="text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-gray-900">No notifications yet</p>
          <p className="text-sm text-gray-500 mt-2">
            {isAdmin ? 'Use "Send Notification" to notify users.' : 'Check back later for updates.'}
          </p>
        </div>

      ) : (
        <div className="space-y-5">
          {/* Filter bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={16} className="text-indigo-600 shrink-0" />
            <button onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap shrink-0 ${filterType === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              All ({notifications.length})
            </button>
            {presentTypes.map((type) => {
              const count = notifications.filter((n) => n.notification_type === type).length;
              return (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap shrink-0 ${filterType === type ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  {notificationTypeLabels[type] || type} ({count})
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500 text-sm">
                No matching notifications
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div key={n.id}
                  className={`rounded-xl border p-5 transition-all hover:shadow-sm ${
                    n.is_read ? "border-gray-100 bg-gray-50/50" : "border-indigo-200 bg-white shadow-sm"
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!n.is_read && <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shrink-0" />}
                        <h2 className={`font-semibold truncate ${n.is_read ? "text-gray-700" : "text-gray-900"}`}>
                          {n.title}
                        </h2>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {n.notification_type && (
                          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                            {notificationTypeLabels[n.notification_type] || n.notification_type}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${n.is_read ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                        {n.is_read ? "Read" : "Unread"}
                      </span>
                      {n.link && (
                        <a href={n.link}
                          className="inline-flex items-center gap-1 text-indigo-600 text-sm font-medium hover:underline">
                          View <ArrowRight size={13} />
                        </a>
                      )}
                    </div>
                  </div>

                  {!n.is_read && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <button disabled={marking === n.id} onClick={() => markAsRead(n.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                        {marking === n.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                        Mark as read
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
