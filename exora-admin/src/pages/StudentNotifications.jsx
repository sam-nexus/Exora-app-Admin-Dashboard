import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCircle, Clock, AlertCircle, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const StudentNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data || []);
    } catch (err) {
      setError('Unable to load notifications');
    } finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const getIcon = (type) => {
    const icons = { payment_received: <Clock size={16} className="text-amber-500" />, support_resolved: <CheckCircle size={16} className="text-emerald-500" />, admin_notification: <Bell size={16} className="text-indigo-500" /> };
    return icons[type] || <Bell size={16} className="text-gray-500" />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 max-w-2xl mx-auto">
      <button onClick={() => navigate("/student")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" /> Back to Dashboard
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">{error}</div>}

      {notifications.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Bell size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-4 cursor-pointer transition hover:shadow-sm ${!n.is_read ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center shrink-0">{getIcon(n.notification_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatDate(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;