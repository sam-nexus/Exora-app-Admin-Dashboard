import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { registerForPushNotifications } from '../firebase-messaging';
import api from '../api/axios';

const Layout = () => {
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('fullName') || localStorage.getItem('email')?.split('@')[0] || 'Admin';
    setAdminName(name);

    // Register browser for push notifications so admin gets FCM alerts
    const registerToken = async () => {
      try {
        const token = await registerForPushNotifications();
        if (!token) return;
        await api.post('/devices/register', { token, platform: 'web' });
      } catch (err) {
        // non-critical — admin still receives DB notifications
        console.warn('Admin push token registration failed:', err);
      }
    };
    registerToken();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="hidden sm:block">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Exora</p>
            <p className="text-sm font-semibold text-gray-800">Admin Panel</p>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            {/* Notification bell — routes to admin notifications page */}
            <NotificationBell to="/notifications" />

            {/* Admin avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {adminName.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {adminName}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
