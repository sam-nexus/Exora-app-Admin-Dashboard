import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getUserId, getUserFullName } from "../utils/auth";
import api from "../api/axios";
import {
  Loader2,
  BookOpen,
  Sparkles,
  Lock,
  Unlock,
  TrendingUp,
  Award,
  Clock,
  ChevronRight,
  GraduationCap,
} from "lucide-react";

const StudentDashboard = () => {
  const userId = getUserId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    unlockedCount: 0,
    lockedCount: 0,
    totalCourses: 0,
    completionRate: 0,
    recentCourses: [],
  });

  const fetchDashboardData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch all courses for this student
      const coursesRes = await api.get(`/courses/user/${userId}`);
      const courses = coursesRes.data || [];

      const unlockedCount = courses.filter((c) => c.is_locked === false).length;
      const lockedCount = courses.filter((c) => c.is_locked === true).length;
      const totalCourses = courses.length;
      const completionRate =
        totalCourses === 0
          ? 0
          : Math.round((unlockedCount / totalCourses) * 100);

      // Get recent courses (last 5)
      const recentCourses = courses.slice(0, 5);

      setDashboardData({
        courses,
        unlockedCount,
        lockedCount,
        totalCourses,
        completionRate,
        recentCourses,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.response?.data?.error || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const studentName = getUserFullName() || "Student";
  const nextMilestone = Math.max(3 - dashboardData.unlockedCount, 0);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-indigo-600 mx-auto mb-3"
          />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Dashboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={20} className="text-indigo-200" />
              <span className="text-indigo-200 text-sm uppercase tracking-wider">
                Exam Preparation
              </span>
            </div>
            <h1 className="text-3xl font-bold">Welcome back, {studentName}</h1>
            <p className="text-indigo-100 mt-2 max-w-2xl text-sm">
              Your study plan is ready. Focus on unlocked courses, practice
              questions, and complete your exam preparation.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 min-w-50">
            <p className="text-indigo-200 text-xs uppercase tracking-wider">
              Next Milestone
            </p>
            <p className="text-2xl font-bold mt-1">
              {nextMilestone === 0
                ? "All Ready!"
                : `Finish ${nextMilestone} more course${nextMilestone > 1 ? "s" : ""}`}
            </p>
            <div className="flex items-center gap-2 mt-2 text-indigo-200 text-sm">
              <Clock size={14} />
              <span>Complete before your exit exam</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={20} />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          value={dashboardData.totalCourses}
          label="Courses Assigned"
          sublabel="In your exam preparation plan"
        />

        <StatCard
          icon={<Sparkles size={20} />}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          value={dashboardData.unlockedCount}
          label="Ready for Practice"
          sublabel="Unlocked courses available"
        />

        <StatCard
          icon={<Lock size={20} />}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          value={dashboardData.lockedCount}
          label="Locked Courses"
          sublabel="Waiting for unlock"
        />

        <StatCard
          icon={<TrendingUp size={20} />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          value={`${dashboardData.completionRate}%`}
          label="Completion Rate"
          sublabel={`${dashboardData.unlockedCount}/${dashboardData.totalCourses} courses unlocked`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Practice Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Practice Quickly
              </h2>
            </div>
            <span className="text-xs text-indigo-600 font-medium">
              Exam-focused
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            Jump into exam-style questions from your unlocked courses and track
            your readiness.
          </p>
          <Link
            to="/student/departments"
            className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            Browse Departments
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Locked Course Guide */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Locked Course Guide
            </h2>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            If a course is locked, you will need payment verification or admin
            approval before practicing.
          </p>
          <div className="space-y-2">
            <GuideItem number={1} text="Check your payment receipt status." />
            <GuideItem
              number={2}
              text="Contact your admin if a course remains locked after approval."
            />
            <GuideItem
              number={3}
              text="Continue with unlocked courses first."
            />
          </div>
        </div>
      </div>

      {/* Latest Assigned Courses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Latest Assigned Courses
            </h2>
          </div>
          <Link
            to="/student/departments"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View All →
          </Link>
        </div>

        <div className="p-6">
          {dashboardData.recentCourses.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={48} className="text-gray-300" />}
              message="No courses assigned yet"
            />
          ) : (
            <div className="space-y-3">
              {console.log(dashboardData.recentCourses)}
              {dashboardData.recentCourses.map((course, idx) => (
                <CourseItem
                  key={course.course_id}
                  index={idx + 1}
                  name={course.courses?.name || "Course"}
                  isLocked={course.is_locked}
                  courseId={course.course_id}
                  departmentId={course.department_id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Study Tips Footer */}
      <div className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <Award size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Study Tip</h3>
            <p className="text-sm text-gray-600 mt-1">
              Focus on one course at a time. Complete all practice questions
              before moving to mock exams. Consistent daily practice improves
              retention 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, iconBg, iconColor, value, label, sublabel }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <div className="flex items-center justify-between mb-3">
      <div
        className={`${iconBg} rounded-xl w-10 h-10 flex items-center justify-center`}
      >
        <div className={iconColor}>{icon}</div>
      </div>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
    </div>
    <p className="text-sm font-medium text-gray-700">{label}</p>
    <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
  </div>
);

const GuideItem = ({ number, text }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-blue-600 text-xs font-bold">{number}</span>
    </div>
    <p className="text-sm text-gray-700">{text}</p>
  </div>
);

const EmptyState = ({ icon, message }) => (
  <div className="text-center py-12">
    {icon}
    <p className="text-gray-500 mt-3">{message}</p>
    <p className="text-sm text-gray-400 mt-1">
      Check back later for new courses
    </p>
  </div>
);

const CourseItem = ({ index, name, isLocked, courseId, departmentId }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
        <span className="text-indigo-600 font-semibold text-sm">{index}</span>
      </div>
      <div>
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {isLocked ? "Requires unlock" : "Ready to practice"}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {isLocked ? (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
          <Lock size={12} />
          Locked
        </span>
      ) : (
        <>
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            <Unlock size={12} />
            Unlocked
          </span>
          <Link
            to={`/student/departments/${departmentId}/courses/${courseId}/practice`}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Practice →
          </Link>
        </>
      )}
    </div>
  </div>
);

export default StudentDashboard;
