import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { listenToUnreadNotifications } from '../firebase-database';

const NotificationBell = ({ to = '/notifications' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);

  // Get user ID from localStorage or token
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setUserId(parsedUser.id);
      } catch (err) {
        console.error('Failed to parse user from localStorage', err);
      }
    }
  }, []);

  // Set up Firebase real-time listener
  useEffect(() => {
    if (!userId) return;

    let unsubscribe = () => {};
    let retryCount = 0;
    const maxRetries = 3;

    const setupFirebaseListener = async () => {
      try {
        unsubscribe = listenToUnreadNotifications(userId, (count) => {
          setUnreadCount(count);
        });
        retryCount = 0; // Reset retry count on success
      } catch (err) {
        console.warn('Firebase listener error, falling back to polling:', err);
        // Fallback to polling if Firebase fails
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupFirebaseListener, 3000);
        } else {
          setupPolling();
        }
      }
    };

    const setupPolling = () => {
      const interval = setInterval(async () => {
        try {
          const { data } = await api.get('/notifications?unread=true');
          setUnreadCount(Array.isArray(data) ? data.length : 0);
        } catch (err) {
          console.error('Unable to load notification count', err);
        }
      }, 5000);

      return () => clearInterval(interval);
    };

    setupFirebaseListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  return (
    <Link to={to} className="relative inline-flex items-center justify-center text-slate-600 hover:text-indigo-700 transition">
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
