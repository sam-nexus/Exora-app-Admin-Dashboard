import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  LifeBuoy,
  User,
  ChevronDown,
} from "lucide-react";
import NotificationBell from './NotificationBell';
import { clearSession, getUserFullName } from "../utils/auth";
import { registerForPushNotifications } from '../firebase-messaging';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const StudentLayout = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentInitial, setStudentInitial] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const [showDownloadBanner, setShowDownloadBanner] = useState(true);
  const { darkMode, toggleTheme } = useTheme();

  // Show/hide banner based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setShowDownloadBanner(false);
      } else {
        setShowDownloadBanner(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const name = getUserFullName() || localStorage.getItem("email")?.split("@")[0] || "Student";
    setStudentName(name);
    setStudentInitial(name.charAt(0).toUpperCase());

    const registerBrowserToken = async () => {
      const token = await registerForPushNotifications();
      if (!token) return;
      try {
        await api.post('/devices/register', { token, platform: 'web' });
      } catch (err) {
        console.error('Device registration failed', err);
      }
    };
    registerBrowserToken();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore errors
    }
    clearSession();
    window.location.href = '/login';
  };




  // Inside StudentLayout component:
  const location = useLocation();

  useEffect(() => {
    const trackPage = async () => {
      const token = localStorage.getItem('token');
      if (!token) {

        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://exora-app-admin-dashboard.onrender.com/api'}/analytics/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            page: location.pathname,
            referrer: document.referrer || '',
            userAgent: navigator.userAgent || '',
          }),
        });

      } catch (err) {

      }
    };

    trackPage();
  }, [location.pathname]);

  const navItems = [
    { path: "/student", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { path: "/student/help-support", icon: <LifeBuoy size={18} />, label: "Support" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Download Mobile App Banner
        <div className={`bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 transition-all duration-300 ${showDownloadBanner ? 'h-10 sm:h-12 opacity-100' : 'h-0 opacity-0 overflow-hidden'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="text-base sm:text-lg">📱</span>
              <span className="hidden sm:inline text-sm font-medium">Download the Exora mobile app for the best experience!</span>
              <span className="sm:hidden text-xs font-medium">Get the Exora App!</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={import.meta.env.VITE_APP_STORE_LINK || "https://t.me/exora_mobile/3"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white text-indigo-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:shadow-lg transition shrink-0"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
              <button
                onClick={() => setShowDownloadBanner(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div> */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <a href="/student" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md px-0 py-0">
                  {!logoError ? (
                    <img src="/logoIcon.png" alt="Exora" className="w-10 h-10 object-cover" onError={() => setLogoError(true)} />
                  ) : (
                    <GraduationCap size={18} className="text-white" />
                  )}
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">Exora</span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/student"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notification Bell */}
              <NotificationBell to="/student/notifications" />

              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {studentInitial}
                  </div>
                  <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => { navigate('/student/profile'); setProfileDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <User size={16} /> Profile
                    </button>
                    <button
                      onClick={() => { handleLogout(); setProfileDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 dark:text-gray-400"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/student"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                    ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
              <button onClick={() => { navigate('/student/profile'); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition">
                <User size={18} /> Profile
              </button>
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fadeIn">
        <Outlet />
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default StudentLayout;