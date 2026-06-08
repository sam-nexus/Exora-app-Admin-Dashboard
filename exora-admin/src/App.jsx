import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Courses from './pages/Courses';
import Questions from './pages/Questions';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Payments from './pages/Payments';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentLayout from './components/StudentLayout';
import StudentDashboard from './pages/StudentDashboard';
import StudentDepartments from './pages/StudentDepartments';
import StudentDepartmentCourses from './pages/StudentDepartmentCourses';
import StudentPracticeMode from './pages/StudentPracticeMode';
import StudentMockExam from './pages/StudentMockExam';
import StudentExitExam from './pages/StudentExitExam';
import StudentPayments from './pages/StudentPayments';
import StudentHelpSupport from './pages/StudentHelpSupport';
import StudentProfile from './pages/StudentProfile';
import Notifications from './pages/Notifications';
import Materials from './pages/Materials';
import NotFound from './pages/NotFound';
import Support from './pages/Support';
import Landing from './pages/Landing';
import StudentNotification from './pages/StudentNotifications';



function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/support" element={<Support />} />
            </Route>
          </Route>

          <Route element={<PrivateRoute allowedRoles={['user']} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="departments" element={<StudentDepartments />} />
              <Route path="departments/:id/courses" element={<StudentDepartmentCourses />} />
              <Route path="departments/:deptId/courses/:courseId/practice" element={<StudentPracticeMode />} />
              <Route path="departments/:deptId/courses/:courseId/mock-exam" element={<StudentMockExam />} />
              <Route path="departments/:deptId/courses/:courseId/exit-exam" element={<StudentExitExam />} />
              <Route path="departments/:deptId/exit-exam" element={<StudentExitExam />} />
              <Route path="payments" element={<StudentPayments />} />
              <Route path="notifications" element={<StudentNotification />} />
              <Route path="help-support" element={<StudentHelpSupport />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>
          </Route>

          {/* Catch-all — any unmatched URL shows the 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
export default App;