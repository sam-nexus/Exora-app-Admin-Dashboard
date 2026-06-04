import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Headphones,
  User,
  LogOut,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
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
        await api.post('/devices/register', {
          token,
          platform: 'web',
        });
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
    {
      path: "/student",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
    },
    {
      path: "/student/departments",
      icon: <BookOpen size={18} />,
      label: "Departments",
    },
    {
      path: "/student/payments",
      icon: <CreditCard size={18} />,
      label: "Payments",
    },
    
    { path: "/student/profile", icon: <User size={18} />, label: "Profile" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-indigo-50/20">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white p-2 rounded-xl shadow-md border border-slate-200"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:relative z-40 bg-white shadow-xl border-r border-slate-200 flex flex-col transition-all duration-300
        ${sidebarOpen ? "w-72" : "w-20"}
        ${mobileMenuOpen ? "left-0" : "-left-full lg:left-0"}
      `}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:shadow-lg transition z-50"
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-300 ${
              sidebarOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Logo Section */}
        <div
          className={`p-5 border-b border-slate-100 ${!sidebarOpen && "lg:px-3"}`}
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <img src="/logoIcon.png" alt="Exora" className="w-7 h-7 object-contain" />
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-500 font-semibold">
                  Exam Portal
                </p>
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Exit Exam Preparation
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200
                ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium border-r-2 border-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                }
                ${!sidebarOpen && "lg:justify-center lg:px-2"}
              `}
              title={!sidebarOpen ? item.label : ""}
            >
              <span className="transition-transform duration-200 group-hover:scale-105 flex-shrink-0">
                {item.icon}
              </span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
              {item.label === "Departments" && sidebarOpen && (
                <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                  15
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div
          className={`border-t border-slate-100 p-4 ${!sidebarOpen && "lg:px-2"}`}
        >
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 ${!sidebarOpen && "lg:justify-center"}`}
          >
            <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-sm flex-shrink-0">
              {studentInitial}
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {studentName}
                </p>
                <p className="text-xs text-slate-500">Student</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 p-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 mt-3
              ${!sidebarOpen && "lg:justify-center"}
            `}
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="px-6 py-3 flex justify-between items-center">
            <div className="hidden lg:block">
              <h2 className="text-sm font-semibold text-slate-800">
                Student Portal
              </h2>
              <p className="text-xs text-slate-500">Exit Exam Preparation</p>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <NotificationBell to="/student/notifications" />
             
              <div className="lg:hidden w-7 h-7 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {studentInitial}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
