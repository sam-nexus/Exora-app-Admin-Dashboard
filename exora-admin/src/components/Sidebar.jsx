import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, BookOpen, FileQuestion, LogOut, DollarSign } from 'lucide-react';

const Sidebar = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 shadow-sm">
      <h1 className="text-2xl font-bold text-indigo-900 mb-8">Exora Admin</h1>
      <nav className="flex-1 space-y-1">
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Users size={20} /> Users
        </NavLink>
        <NavLink to="/departments" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Building2 size={20} /> Departments
        </NavLink>
        <NavLink to="/courses" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <BookOpen size={20} /> Courses
        </NavLink>
        <NavLink to="/questions" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <FileQuestion size={20} /> Questions
        </NavLink>
        <NavLink to="/payments" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
          <DollarSign size={20} /> Payments
        </NavLink>
      </nav>
      <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 mt-auto transition-colors">
        <LogOut size={20} /> Logout
      </button>
    </aside>
  );
};
export default Sidebar;