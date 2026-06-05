import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getUserId, getUserFullName } from "../utils/auth";
import api from "../api/axios";
import {
  BookOpen,
  Sparkles,
  Lock,
  Unlock,
  TrendingUp,
  Clock,
  ChevronRight,
  GraduationCap,
  Target,
  Flame,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Brain,
  BarChart3,
  Award,
  Loader2,
  Rocket,
  Star,
  Download,
  Users,
  Bell,
  Smartphone,
} from "lucide-react";

const StudentDashboard = () => {
  const userId = getUserId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    studyStreak: 0,
    totalHours: 0,
    rank: "Beginner",
    totalQuestionsAnswered: 0,
    averageScore: 0,
  });
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    unlockedCount: 0,
    lockedCount: 0,
    totalCourses: 0,
    completionRate: 0,
    recentCourses: [],
    upcomingExams: [],
  });

  const fetchDashboardData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch courses
      const coursesRes = await api.get(`/courses/user/${userId}`);
      const courses = coursesRes.data || [];

      const unlockedCount = courses.filter((c) => c.is_locked === false).length;
      const lockedCount = courses.filter((c) => c.is_locked === true).length;
      const totalCourses = courses.length;
      const completionRate = totalCourses === 0 ? 0 : Math.round((unlockedCount / totalCourses) * 100);

      const recentCourses = courses.slice(0, 5);

      // Fetch user stats
      try {
        const statsRes = await api.get(`/student/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setStats({
          studyStreak: statsRes.data.studyStreak || 0,
          totalHours: statsRes.data.totalHours || 0,
          rank: statsRes.data.rank || "Beginner",
          totalQuestionsAnswered: statsRes.data.totalQuestionsAnswered || 0,
          averageScore: statsRes.data.averageScore || 0,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }

      // Fetch upcoming exams
      let upcomingExams = [];
      try {
        const examsRes = await api.get(`/student/upcoming-exams`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        upcomingExams = examsRes.data || [];
      } catch (err) {
        console.error("Error fetching upcoming exams:", err);
      }

      setDashboardData({
        courses,
        unlockedCount,
        lockedCount,
        totalCourses,
        completionRate,
        recentCourses,
        upcomingExams,
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
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const getRankBadge = () => {
    const ranks = {
      Beginner: { color: "from-gray-500 to-gray-600", icon: <Star size={12} />, label: "Beginner" },
      Intermediate: { color: "from-blue-500 to-indigo-600", icon: <TrendingUp size={12} />, label: "Intermediate" },
      Advanced: { color: "from-indigo-500 to-purple-600", icon: <Award size={12} />, label: "Advanced" },
      Expert: { color: "from-purple-500 to-pink-600", icon: <Rocket size={12} />, label: "Expert" },
      Master: { color: "from-amber-500 to-orange-600", icon: <Trophy size={12} />, label: "Master" },
    };
    return ranks[stats.rank] || ranks.Beginner;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-gray-400 mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition"
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
      <div className="bg-gray-800 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-white/15 p-1.5 rounded-lg">
                <GraduationCap size={16} className="text-white" />
              </div>
              <span className="text-gray-300 text-xs uppercase tracking-wider font-medium">
                Exit Exam Preparation
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${getRankBadge().color} text-white`}>
                {getRankBadge().icon}
                {getRankBadge().label}
              </span>
            </div>
            <h1 className="text-2xl font-bold">
              Welcome back, {studentName}!
            </h1>
            <p className="text-gray-300 text-sm max-w-xl">
              Your study plan is ready. Focus on unlocked courses and complete your exam preparation.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-gray-300 text-xs">
                <Calendar size={12} />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 text-xs">
                <Flame size={12} />
                <span>{stats.studyStreak} day streak</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 text-xs">
                <Clock size={12} />
                <span>{stats.totalHours} hours studied</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 min-w-[150px]">
            <p className="text-gray-300 text-xs uppercase tracking-wider flex items-center gap-1">
              <Target size={11} />
              Next Milestone
            </p>
            <p className="text-2xl font-bold mt-1">
              {nextMilestone === 0 ? "All Ready! 🎉" : `${nextMilestone} more course${nextMilestone > 1 ? "s" : ""}`}
            </p>
            <div className="flex items-center gap-2 mt-2 text-gray-300 text-xs">
              <Rocket size={11} />
              <span>Unlock to advance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<BookOpen size={16} />}
          value={dashboardData.totalCourses}
          label="Courses"
          sublabel="Assigned"
          color="blue"
        />
        <StatCard
          icon={<Sparkles size={16} />}
          value={dashboardData.unlockedCount}
          label="Unlocked"
          sublabel="Available"
          color="green"
          trend="positive"
        />
        <StatCard
          icon={<Lock size={16} />}
          value={dashboardData.lockedCount}
          label="Locked"
          sublabel="Need unlock"
          color="orange"
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          value={`${dashboardData.completionRate}%`}
          label="Completion"
          sublabel={`${dashboardData.unlockedCount}/${dashboardData.totalCourses}`}
          color="purple"
          progress={dashboardData.completionRate}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <QuickPracticeCard />
        <LockedCourseGuide />
      </div>

      {/* Latest Courses */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Courses</h2>
              <p className="text-xs text-gray-500">Continue where you left off</p>
            </div>
          </div>
          <Link
            to="/student/departments"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            View All <ArrowRight size={12} />
          </Link>
        </div>

        <div className="p-5">
          {dashboardData.recentCourses.length === 0 ? (
            <EmptyState icon={<BookOpen size={28} className="text-gray-300" />} message="No courses assigned yet" />
          ) : (
            <div className="space-y-2">
              {dashboardData.recentCourses.slice(0, 4).map((course, idx) => (
                <CourseItem
                  key={course.course_id || idx}
                  index={idx + 1}
                  name={course.courses?.name || course.name || "Course"}
                  isLocked={course.is_locked}
                  courseId={course.course_id || course.id}
                  departmentId={course.department_id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Channel & Download App */}
      <div className="grid sm:grid-cols-2 gap-3">
        <a 
          href={import.meta.env.VITE_TELEGRAM_LINK}
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-3 p-4 bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl shrink-0">
            📣
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Join Telegram Channel</p>
            <p className="text-gray-300 text-xs mt-0.5">Get exam tips & updates</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </a>

        <a 
          href={import.meta.env.VITE_APP_STORE_LINK}
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-3 p-4 bg-gray-800 rounded-xl hover:bg-gray-900 transition-all duration-200"
        >
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl shrink-0">
            📱
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Download Mobile App</p>
            <p className="text-gray-300 text-xs mt-0.5">Study on the go</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Study Tip */}
      <StudyTipCard />
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, value, label, sublabel, color, trend, progress }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 ${colors[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xl font-bold text-gray-800">{value}</span>
      </div>
      <p className="text-xs font-medium text-gray-700">{label}</p>
      <p className="text-[10px] text-gray-400">{sublabel}</p>
      {progress !== undefined && (
        <div className="mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const QuickPracticeCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-indigo-600" />
        </div>
        <h3 className="font-semibold text-gray-800">Quick Practice</h3>
      </div>
      <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Exam-focused</span>
    </div>
    <p className="text-gray-500 text-xs mb-3">Jump into exam-style questions from your unlocked courses.</p>
    <Link to="/student/departments" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
      Browse Departments <ArrowRight size={11} />
    </Link>
  </div>
);

const LockedCourseGuide = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
        <Lock size={14} className="text-amber-600" />
      </div>
      <h3 className="font-semibold text-gray-800">Locked Courses</h3>
    </div>
    <p className="text-gray-500 text-xs mb-2">Unlock courses by:</p>
    <ul className="space-y-1.5 text-xs text-gray-600">
      <li className="flex items-center gap-2">1. Upload payment receipt in Payments</li>
      <li className="flex items-center gap-2">2. Wait for admin approval (within 24h)</li>
      <li className="flex items-center gap-2">3. Continue with unlocked courses</li>
    </ul>
  </div>
);

const EmptyState = ({ icon, message }) => (
  <div className="text-center py-6">
    <div className="inline-flex p-2 bg-gray-50 rounded-full mb-2">{icon}</div>
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

const CourseItem = ({ index, name, isLocked, courseId, departmentId }) => (
  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center">
        <span className="text-white font-medium text-[10px]">{index}</span>
      </div>
      <div>
        <p className="font-medium text-gray-800 text-sm">{name}</p>
        <p className="text-[10px] text-gray-500">{isLocked ? "Requires unlock" : "Ready to practice"}</p>
      </div>
    </div>
    {isLocked ? (
      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Locked</span>
    ) : (
      <Link to={`/student/departments/${departmentId}/courses/${courseId}/practice`} className="text-xs text-indigo-600 hover:text-indigo-700">
        Practice →
      </Link>
    )}
  </div>
);

const StudyTipCard = () => (
  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
        <Brain size={14} className="text-white" />
      </div>
      <div>
        <h4 className="font-medium text-gray-800 text-sm flex items-center gap-2">
          Study Tip <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">💡</span>
        </h4>
        <p className="text-gray-600 text-xs mt-1">Focus on one course at a time. Consistent daily practice improves retention significantly.</p>
      </div>
    </div>
  </div>
);

// Trophy component
const Trophy = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default StudentDashboard;