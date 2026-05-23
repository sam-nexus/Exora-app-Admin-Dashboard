import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Courses from './pages/Courses';
import Questions from './pages/Questions';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Payments from './pages/Payments';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/payments" element={<Payments />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
export default App;