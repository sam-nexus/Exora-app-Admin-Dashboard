import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getUserId, getUserFullName } from "../utils/auth";
import api from "../api/axios";
import {
  GraduationCap,
  Target,
  Flame,
  Calendar,
  Clock,
  Search,
  ChevronRight,
  Brain,
  Loader2,
  AlertCircle,
  Lock,
  Unlock,
  ArrowRight,
} from "lucide-react";

const StudentDashboard = () => {
  const userId = getUserId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [courseCounts, setCourseCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ studyStreak: 0, totalHours: 0 });

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const [deptsRes, coursesRes, statsRes] = await Promise.all([
        api.get("/departments"),
        api.get("/courses"),
        api.get("/student/stats", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).catch(() => ({ data: {} })),
      ]);
      setDepartments(deptsRes.data || []);
      const counts = (coursesRes.data || []).reduce((acc, course) => {
        const deptId = course.department_id || course.departments?.id || course.department?.id;
        if (!deptId) return acc;
        acc[deptId] = (acc[deptId] || 0) + 1;
        return acc;
      }, {});
      setCourseCounts(counts);
      setStats({ studyStreak: statsRes.data.studyStreak || 0, totalHours: statsRes.data.totalHours || 0 });
    } catch (err) {
      setError("Unable to load dashboard");
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const studentName = getUserFullName() || "Student";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const filteredDepts = departments.filter((d) => d.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-400 dark:text-gray-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Greeting Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="text-indigo-200 text-sm font-medium">Exit Exam Preparation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {studentName}! 👋</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-indigo-200">
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {today}</span>
              <span className="flex items-center gap-1.5"><Flame size={14} /> {stats.studyStreak} day streak</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {stats.totalHours}h studied</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center min-w-[120px]">
            <Target size={20} className="text-white mx-auto mb-1" />
            <p className="text-white/70 text-xs">Focus Today</p>
            <p className="text-lg font-bold">Stay Consistent</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchData} className="ml-auto text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepts.map((dept, index) => {
          const isLocked = dept.isLocked ?? false;
          return (
            <Link
              key={dept.id}
              to={isLocked ? "#" : `/student/departments/${dept.id}/courses`}
              onClick={(e) => { if (isLocked) e.preventDefault(); }}
              className={`group relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-2 animate-fadeInUp ${isLocked
                  ? 'border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/40'
                  : 'border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-2xl shadow-lg'
                }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Decorative corner gradient */}
              {!isLocked && (
                <>
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                </>
              )}

              <div className="relative z-10">
                {/* Icon Section */}
                <div className="mb-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${isLocked
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/20 dark:to-purple-500/20 shadow-lg group-hover:shadow-xl'
                    }`}>
                    <span className="group-hover:animate-bounce">{dept.icon || '📚'}</span>
                  </div>
                </div>

                {/* Department Name */}
                <h3 className={`font-bold text-base mb-3 transition-colors duration-300 ${isLocked
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}>
                  {dept.name}
                </h3>

                {/* Status Badge */}
                <div className="mb-4">
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Lock size={12} /> Locked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <Unlock size={12} /> Unlocked
                    </span>
                  )}
                </div>

                {/* Action Link */}
                <div className={`flex items-center justify-between pt-3 border-t ${isLocked
                    ? 'border-gray-100 dark:border-gray-700'
                    : 'border-indigo-100 dark:border-indigo-800'
                  }`}>
                  <span className={`text-sm font-semibold transition-colors ${isLocked
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300'
                    }`}>
                    {isLocked ? 'Unlock to access' : 'Browse Courses'}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isLocked
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md'
                    }`}>
                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* How It Works */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6 sm:p-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-indigo-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="relative">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold mb-3">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Getting Started
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">How It Works</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Three simple steps to ace your exit exams</p>
          </div>

          {/* Steps */}
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
                title: 'Choose Department',
                desc: 'Select your field of study from the available departments.',
                color: 'indigo',
              },
              {
                step: '02',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Unlock Courses',
                desc: 'Make a one-time payment and upload your receipt.',
                color: 'purple',
              },
              {
                step: '03',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Practice & Excel',
                desc: 'Take exams, track your progress, and ace your exit exams.',
                color: 'emerald',
              },
            ].map((item, i) => {
              const colors = {
                indigo: {
                  bg: 'bg-indigo-100 dark:bg-indigo-900/30',
                  text: 'text-indigo-600 dark:text-indigo-400',
                  badge: 'bg-indigo-600',
                  hover: 'group-hover:shadow-indigo-200 dark:group-hover:shadow-indigo-900',
                  dot: 'bg-indigo-500',
                },
                purple: {
                  bg: 'bg-purple-100 dark:bg-purple-900/30',
                  text: 'text-purple-600 dark:text-purple-400',
                  badge: 'bg-purple-600',
                  hover: 'group-hover:shadow-purple-200 dark:group-hover:shadow-purple-900',
                  dot: 'bg-purple-500',
                },
                emerald: {
                  bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                  text: 'text-emerald-600 dark:text-emerald-400',
                  badge: 'bg-emerald-600',
                  hover: 'group-hover:shadow-emerald-200 dark:group-hover:shadow-emerald-900',
                  dot: 'bg-emerald-500',
                },
              };
              const c = colors[item.color];

              return (
                <div
                  key={i}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fadeInUp"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Step Number Badge */}
                  <div className={`absolute -top-3 -right-3 w-8 h-8 ${c.badge} text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg`}>
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>

                  {/* Connecting line (between cards) */}
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Need help?{' '}
              <a href="/student/help-support" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Study Tip + CTA */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Brain size={14} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-white text-sm">Study Tip</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Practice one course at a time. Consistent daily effort beats cramming.</p>
          </div>
        </div>
        <a href={"https://t.me/exora_mobile"} target="_blank" rel="noopener noreferrer"
          className="bg-gray-800 dark:bg-gray-700 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-900 dark:hover:bg-gray-600 transition group">
          <span className="text-2xl">📣</span>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Join Telegram Channel</p>
            <p className="text-gray-300 dark:text-gray-400 text-xs">Get exam tips & updates</p>
          </div>
          <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Footer */}
      <footer className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md flex items-center justify-center">
              <GraduationCap size={12} className="text-white" />
            </div>
            <span>Exora — Exit Exam Preparation Platform</span>
          </div>
          <div className="flex gap-4">
            <a href="/student/help-support" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Support</a>
            <span>© 2026 Exora</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentDashboard;