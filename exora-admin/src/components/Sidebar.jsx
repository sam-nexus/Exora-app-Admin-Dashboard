import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, FileQuestion, LogOut } from 'lucide-react';

const Sidebar = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-indigo-900 text-white flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-8">Exora Admin</h1>
      <nav className="flex-1 space-y-2">
        <NavLink to="/" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-800">
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/users" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-800">
          <Users size={20} /> Users
        </NavLink>
        <NavLink to="/courses" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-800">
          <BookOpen size={20} /> Courses
        </NavLink>
        <NavLink to="/questions" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-800">
          <FileQuestion size={20} /> Questions
        </NavLink>
      </nav>
      <button onClick={handleLogout} className="flex items-center gap-3 p-2 rounded hover:bg-red-700 mt-auto">
        <LogOut size={20} /> Logout
      </button>
    </aside>
  );
};

export default Sidebar;