import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  FileQuestion,
  LogOut,
  DollarSign,
  Bell,
  GraduationCap,
  ChevronRight,
  Menu,
  X,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const navItems = [
    { path: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/users", icon: <Users size={20} />, label: "Users" },
    {
      path: "/departments",
      icon: <Building2 size={20} />,
      label: "Departments",
    },
    { path: "/courses", icon: <BookOpen size={20} />, label: "Courses" },
    {
      path: "/questions",
      icon: <FileQuestion size={20} />,
      label: "Questions",
    },
    { path: "/materials", icon: <FileText size={20} />, label: "Materials" },
    { path: "/payments", icon: <DollarSign size={20} />, label: "Payments" },
    {
      path: "/notifications",
      icon: <Bell size={20} />,
      label: "Notifications",
    },
    { path: "/support", icon: <MessageSquare size={20} />, label: "Support" },
  ];

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-xl shadow-lg border border-gray-200"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:relative z-40 bg-white shadow-xl border-r border-gray-100 flex flex-col transition-all duration-300
        ${isCollapsed ? "w-20" : "w-64"}
        ${isMobileOpen ? "left-0" : "-left-full lg:left-0"}
      `}
      >
        {/* Logo Section */}
        <div
          className={`p-5 border-b border-gray-100 ${isCollapsed ? "lg:px-3" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md ring-2 ring-white/60 flex-shrink-0">
              <img src="/logoIcon.png" alt="Exora" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Exora Admin
                </h1>
                <p className="text-xs text-gray-400">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle Button (Desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition z-50"
        >
          <ChevronRight
            size={14}
            className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          />
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium border-r-2 border-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                  }
                  ${isCollapsed ? "lg:justify-center lg:px-0" : ""}
                `}
                title={isCollapsed ? item.label : ""}
              >
                <span
                  className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-indigo-600" : ""}`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
                {isActive && !isCollapsed && (
                  <ChevronRight size={14} className="ml-auto text-indigo-500" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className={`border-t border-gray-100 p-4 ${isCollapsed ? "lg:px-2" : ""}`}
        >
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 p-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group
              ${isCollapsed ? "lg:justify-center" : ""}
            `}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;