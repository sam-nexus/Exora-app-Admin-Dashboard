import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  User,
  LogOut,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Shield,
  LifeBuoy,
  Download,
  Users,
  Bell,
  Smartphone,
  Gift,
  Rocket,
  TrendingUp,
  Target,
} from "lucide-react";
import NotificationBell from './NotificationBell';
import { clearSession, getUserFullName } from "../utils/auth";
import { registerForPushNotifications } from '../firebase-messaging';
import api from '../api/axios';

const StudentLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentInitial, setStudentInitial] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    {
      icon: <Bell size={12} className="text-indigo-500" />,
      title: "Stay Updated",
      message: "Enable notifications for exam alerts",
      action: "Turn on",
      link: "/student/notifications",
      external: false,
    },
    {
      icon: <Users size={12} className="text-emerald-500" />,
      title: "Join Community",
      message: "Connect with fellow students on Telegram",
      action: "Join Now",
      link: import.meta.env.VITE_TELEGRAM_LINK || "https://t.me/exora_mobile",
      external: true,
    },
    {
      icon: <Download size={12} className="text-blue-500" />,
      title: "Mobile App",
      message: "Study on the go with our mobile app",
      action: "Download",
      link: import.meta.env.VITE_APP_STORE_LINK || "https://play.google.com/store",
      external: true,
    },
    {
      icon: <Gift size={12} className="text-amber-500" />,
      title: "Refer & Earn",
      message: "Invite friends and get free unlocks",
      action: "Learn More",
      link: "/student/help-support",
      external: false,
    },
    {
      icon: <Rocket size={12} className="text-purple-500" />,
      title: "Daily Challenge",
      message: "Complete today's challenge for bonus points",
      action: "Start Now",
      link: "/student/departments",
      external: false,
    },
    {
      icon: <TrendingUp size={12} className="text-cyan-500" />,
      title: "Study Streak",
      message: "Keep your streak going every day!",
      action: "View Stats",
      link: "/student/profile",
      external: false,
    },
    {
      icon: <Target size={12} className="text-rose-500" />,
      title: "Mock Exams",
      message: "New mock exams available this week",
      action: "Practice",
      link: "/student/departments",
      external: false,
    },
    {
      icon: <Smartphone size={12} className="text-indigo-500" />,
      title: "Offline Mode",
      message: "Download materials for offline study",
      action: "Download Now",
      link: "/student/departments",
      external: false,
    },
  ];

  // Rotate tip every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips.length]);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const name =
      getUserFullName() ||
      localStorage.getItem("email")?.split("@")[0] ||
      "Student";
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

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  const navItems = [
    { path: "/student",              icon: <LayoutDashboard size={20} />, label: "Dashboard",     badge: null },
    { path: "/student/departments",  icon: <BookOpen size={20} />,        label: "Departments",   badge: null },
    { path: "/student/payments",     icon: <CreditCard size={20} />,      label: "Payments",      badge: null },
    { path: "/student/help-support", icon: <LifeBuoy size={20} />,        label: "Help & Support", badge: null },
    { path: "/student/profile",      icon: <User size={20} />,            label: "Profile",       badge: null },
  ];

  const currentTip = tips[currentTipIndex];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white/90 backdrop-blur p-2.5 rounded-xl shadow-lg border border-slate-200 hover:bg-white transition-all duration-200"
        >
          {mobileMenuOpen
            ? <X size={20} className="text-indigo-600" />
            : <Menu size={20} className="text-slate-700" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-40 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200/60
        flex flex-col transition-all duration-300 ease-in-out h-full
        ${sidebarOpen ? "w-72" : "lg:w-20"}
        ${mobileMenuOpen ? "left-0" : "-left-full lg:left-0"}
      `}>

        {/* Toggle Button – desktop only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-24 bg-white border border-slate-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 z-50 hover:scale-110"
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-300 text-indigo-500 ${sidebarOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Logo */}
        <div className={`p-5 border-b border-slate-100/80 ${!sidebarOpen && "lg:px-3"}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-md opacity-40" />
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md flex-shrink-0 ring-2 ring-white/60">
                <img src="/logoIcon.png" alt="Exora" className="w-full h-full object-cover" />
              </div>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold">Student Portal</p>
                <h1 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Exit Exam Prep
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Welcome + Rotating Tip */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-b border-slate-100/80">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-indigo-500" />
                <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Welcome Back</p>
              </div>
              <p className="text-sm font-bold text-slate-800 truncate">{studentName}</p>

              {/* Rotating tip card */}
              <div className="mt-3 pt-2 border-t border-indigo-100/50">
                <div className="bg-white/60 rounded-lg p-2 animate-slideUp">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      {currentTip.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-gray-700">💡 {currentTip.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{currentTip.message}</p>
                      <button
                        onClick={() =>
                          currentTip.external
                            ? window.open(currentTip.link, "_blank")
                            : (window.location.href = currentTip.link)
                        }
                        className="text-[9px] font-medium text-indigo-600 hover:text-indigo-700 mt-1 hover:underline"
                      >
                        {currentTip.action} →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1 mt-2">
                  {tips.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTipIndex(idx)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        idx === currentTipIndex ? "w-3 bg-indigo-500" : "w-1 bg-indigo-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <p className="px-2 mb-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Main Menu
            </p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/student"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200
                ${isActive
                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                }
                ${!sidebarOpen && "lg:justify-center lg:px-2"}`
              }
              title={!sidebarOpen ? item.label : ""}
            >
              <span className={`transition-all duration-200 group-hover:scale-110 flex-shrink-0 ${sidebarOpen ? "w-5" : ""}`}>
                {item.icon}
              </span>
              {sidebarOpen && <span className="text-sm flex-1">{item.label}</span>}
              {item.badge && sidebarOpen && (
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
              {item.badge && !sidebarOpen && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {item.badge}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className={`border-t border-slate-100/80 p-4 ${!sidebarOpen && "lg:px-2"}`}>
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 ${!sidebarOpen && "lg:justify-center"}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-sm opacity-40" />
              <div className="relative w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm flex-shrink-0">
                {studentInitial}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{studentName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Shield size={10} /> Student
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 mt-3 ${!sidebarOpen && "lg:justify-center"}`}
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>

          {sidebarOpen && (
            <div className="mt-4 pt-2 text-center">
              <p className="text-[10px] text-slate-400">© 2026 Exit Exam Portal</p>
              <p className="text-[9px] text-slate-300">v2.0.0</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
          <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
            <div className="hidden lg:block">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <GraduationCap size={16} className="text-indigo-500" />
                Student Learning Hub
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span>Exit Exam Preparation</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>Your success starts here</span>
              </p>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <NotificationBell to="/student/notifications" />
              <div className="lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {studentInitial}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 animate-fadeIn">
          <Outlet />
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn  { animation: fadeIn  0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default StudentLayout;
