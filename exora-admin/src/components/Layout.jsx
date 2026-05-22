import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => (
  <div className="flex h-screen bg-gray-50">
    <Sidebar />
    <div className="flex-1 overflow-auto p-6">
      <Outlet />
    </div>
  </div>
);
export default Layout;