import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { listenToUnreadNotifications } from '../firebase-database';

const NotificationBell = ({ to = '/notifications' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);

  // Get user ID from localStorage
  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) setUserId(id);
  }, []);

  // Initial fetch from backend — this also syncs count to Firebase
  useEffect(() => {
    if (!userId) return;
    api.get('/notifications?unread=true')
      .then(({ data }) => {
        setUnreadCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => {});
  }, [userId]);

  // Real-time Firebase listener — updates bell instantly when backend writes to Firebase
  useEffect(() => {
    if (!userId) return;

    let retryCount = 0;
    let pollingInterval = null;

    const setupFirebaseListener = () => {
      try {
        const unsubscribe = listenToUnreadNotifications(userId, (count) => {
          setUnreadCount(count);
        });
        return unsubscribe;
      } catch (err) {
        console.warn('Firebase listener failed, falling back to polling:', err);
        // Fallback: poll every 10s
        pollingInterval = setInterval(() => {
          api.get('/notifications?unread=true')
            .then(({ data }) => setUnreadCount(Array.isArray(data) ? data.length : 0))
            .catch(() => {});
        }, 10000);
        return () => {};
      }
    };

    const unsubscribe = setupFirebaseListener();

    return () => {
      unsubscribe();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [userId]);

  return (
    <Link
      to={to}
      className="relative inline-flex items-center justify-center text-slate-600 hover:text-indigo-700 transition"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
