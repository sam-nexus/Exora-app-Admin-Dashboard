import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const NotificationBell = ({ to = '/notifications' }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get('/notifications?unread=true');
        if (isMounted) {
          setUnreadCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        console.error('Unable to load notification count', err);
      }
    };

    fetchUnreadCount();

    return () => {
      isMounted = false;
    };
  }, []);

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
