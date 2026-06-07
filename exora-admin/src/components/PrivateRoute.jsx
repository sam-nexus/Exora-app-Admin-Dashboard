import { Navigate, Outlet } from 'react-router-dom';
import { getToken, getUserRole } from '../utils/auth';

const PrivateRoute = ({ allowedRoles = [] }) => {
  const token = getToken();
  const role = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/dashboard' : '/student'} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;