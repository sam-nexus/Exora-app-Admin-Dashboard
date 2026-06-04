import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Award,
  BookOpen,
  Clock,
  CheckCircle,
  TrendingUp,
  Target,
  Sparkles,
  PlayCircle,
  GraduationCap,
  ChevronRight,
  Lock,
  Unlock,
  Layers,
  FileText,
  Trophy,
  Flame,
} from "lucide-react";
import api from "../api/axios";
import { getUserId } from "../utils/auth";

const getPracticeProgressKey = (courseId) => `practice-progress:${courseId}`;

const loadCoursePracticeProgress = (courseId) => {
  if (!courseId) return null;
  try {
    const cached = localStorage.getItem(getPracticeProgressKey(courseId));
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: "regular", label: "Practice",   icon: BookOpen,  color: "indigo" },
  { key: "mock",    label: "Mock Exams", icon: FileText,  color: "purple" },
  { key: "exit",    label: "Exit Exam",  icon: Trophy,    color: "emerald" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const progressColor = (pct) => {
  if (pct === 0)   return "bg-gray-200";
  if (pct < 50)    return "bg-orange-400";
  if (pct < 100)   return "bg-indigo-500";
  return "bg-emerald-500";
};

const StatusPill = ({ progress }) => {
  const v = Number(progress ?? 0);
  if (v === 0)   return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"><Clock size={10}/>Not started</span>;
  if (v === 100) return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle size={10}/>Done</span>;
  return           <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full"><Flame size={10}/>In progress</span>;
};

// ─── Course card ──────────────────────────────────────────────────────────────
const CourseCard = ({ course, index, deptId, tab }) => {
  const progress  = Number(course.progress ?? 0);
  const isLocked  = course.is_locked === true;
  const name      = course.name || course.title || "Course";

  const practiceLink = `/student/departments/${deptId}/courses/${course.id}/practice`;
  const mockLink     = `/student/departments/${deptId}/courses/${course.id}/mock-exam`;
  const exitLink     = `/student/departments/${deptId}/exit-exam`;
  const href         = tab === "mock" ? mockLink : tab === "exit" ? exitLink : practiceLink;

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden
      ${isLocked
        ? "border-gray-200 opacity-75"
        : "border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 hover:-translate-y-0.5"
      }`}
    >
      {/* colour accent top bar */}
      <div className={`h-1 w-full ${
        tab === "mock"
          ? "bg-gradient-to-r from-purple-400 to-purple-600"
          : tab === "exit"
          ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
          : progress === 100
          ? "bg-gradient-to-r from-emerald-400 to-teal-500"
          : progress > 0
          ? "bg-gradient-to-r from-orange-400 to-amber-400"
          : "bg-gray-100"
      }`} />

      <div className="p-5">
        {/* row 1 — index + status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm
              ${tab === "mock" ? "bg-purple-500" : tab === "exit" ? "bg-emerald-500" : "bg-indigo-500"}`}>
              {index + 1}
            </div>
            <StatusPill progress={progress} />
          </div>

          {isLocked ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
              <Lock size={10} /> Locked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <Unlock size={10} /> Unlocked
            </span>
          )}
        </div>

        {/* row 2 — title */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {name}
        </h3>

        {/* row 3 — progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Progress</span>
            <span className={`text-[11px] font-bold ${progress === 100 ? "text-emerald-600" : progress > 0 ? "text-orange-500" : "text-gray-400"}`}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor(progress)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* row 4 — CTA */}
        {isLocked ? (
          <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-400 cursor-not-allowed select-none">
            <Lock size={13} /> Requires unlock
          </div>
        ) : (
          <Link
            to={href}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all
              ${tab === "mock"
                ? "bg-purple-600 hover:bg-purple-700"
                : tab === "exit"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-indigo-600 hover:bg-indigo-700"
              } hover:shadow-md active:scale-95`}
          >
            {tab === "mock" ? (
              <><Sparkles size={13} /> Start Mock</>
            ) : (
              <><PlayCircle size={13} /> {progress > 0 && progress < 100 ? "Continue" : "Start Practice"}</>
            )}
          </Link>
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const StudentDepartmentCourses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = getUserId();

  const [loading, setLoading]     = useState(true);
  const [department, setDepartment] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab]   = useState("regular");

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const [deptsRes, coursesRes] = await Promise.all([
          api.get("/departments"),
          api.get("/courses", { params: { department_id: id } }),
        ]);

        const dept = (deptsRes.data || []).find((d) => d.id.toString() === id);
        setDepartment(dept || { name: "Department" });

        // Fetch lock status for this user
        let lockMap = {};
        if (userId) {
          try {
            const userCoursesRes = await api.get(`/courses/user/${userId}`);
            (userCoursesRes.data || []).forEach((uc) => {
              lockMap[uc.course_id] = uc.is_locked;
            });
          } catch {
            // not critical
          }
        }

        const enriched = (coursesRes.data || []).map((course) => {
          const saved    = loadCoursePracticeProgress(course.id);
          const progress = saved?.questionCount > 0
            ? Math.round(((saved.answeredCount ?? 0) / saved.questionCount) * 100)
            : 0;
          return {
            ...course,
            progress,
            is_locked: lockMap[course.id] ?? course.is_locked ?? false,
          };
        });

        setAllCourses(enriched);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, userId]);

  // ── derived data ──────────────────────────────────────────────────────────
  const regularCourses = allCourses.filter((c) => !c.type || c.type === "regular");
  const mockCourses    = allCourses.filter((c) => c.type === "mock");
  const exitCourses    = allCourses.filter((c) => c.type === "exit");

  const tabCourses = activeTab === "regular" ? regularCourses : activeTab === "mock" ? mockCourses : exitCourses;

  const filtered = tabCourses.filter((c) =>
    (c.name || c.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedRegular  = regularCourses.filter((c) => c.progress === 100).length;
  const totalRegular      = regularCourses.length;
  const overallProgress   = totalRegular > 0
    ? Math.round(regularCourses.reduce((s, c) => s + c.progress, 0) / totalRegular)
    : 0;
  const isExitReady = completedRegular === totalRegular && totalRegular > 0;

  const tabCountLabel = {
    regular: regularCourses.length,
    mock:    mockCourses.length,
    exit:    exitCourses.length,
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading courses…</p>
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── back button ── */}
      <button
        onClick={() => navigate("/student/departments")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition" />
        Back to Departments
      </button>

      {/* ── hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8 text-white shadow-xl">
        {/* decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* left */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
              <span className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">Department</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">
              {department?.icon && <span className="mr-2">{department.icon}</span>}
              {department?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-indigo-200">
              <span className="flex items-center gap-1"><Layers size={13} />{totalRegular} courses</span>
              <span className="w-1 h-1 bg-indigo-400 rounded-full" />
              <span className="flex items-center gap-1"><CheckCircle size={13} />{completedRegular} completed</span>
              <span className="w-1 h-1 bg-indigo-400 rounded-full" />
              <span className="flex items-center gap-1"><TrendingUp size={13} />{totalRegular - completedRegular} remaining</span>
            </div>
          </div>

          {/* right — progress ring-style card */}
          <div className="shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 min-w-[160px] text-center">
            <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-widest mb-1">Overall</p>
            <p className="text-5xl font-extrabold leading-none">{overallProgress}<span className="text-2xl text-indigo-300">%</span></p>
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-indigo-200 text-[11px] mt-2">
              {overallProgress === 100 ? "🎉 All done!" : "Keep going!"}
            </p>
          </div>
        </div>
      </div>

      {/* ── tab bar ── */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon, color }) => {
          const count = tabCountLabel[key];
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150
                ${active
                  ? `bg-white text-${color}-600 shadow-sm`
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Icon size={15} />
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${active ? `bg-${color}-100 text-${color}-700` : "bg-gray-200 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── exit exam tab ── */}
      {activeTab === "exit" && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Department Exit Exam</h2>
                <p className="text-sm text-gray-500 mb-3">
                  Complete all {totalRegular} practice courses to unlock this exam and earn your certificate.
                </p>
                {/* course progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: totalRegular > 0 ? `${(completedRegular / totalRegular) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {completedRegular} / {totalRegular} courses
                  </span>
                </div>
              </div>
            </div>

            <Link
              to={`/student/departments/${id}/exit-exam`}
              onClick={(e) => { if (!isExitReady) e.preventDefault(); }}
              className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all
                ${isExitReady
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              <Award size={16} />
              {isExitReady ? "Take Exit Exam" : "Complete courses first"}
              {isExitReady && <ChevronRight size={15} />}
            </Link>
          </div>

          {/* exit course list */}
          {exitCourses.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {exitCourses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} deptId={id} tab="exit" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── regular / mock tab ── */}
      {(activeTab === "regular" || activeTab === "mock") && (
        <>
          {/* stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total",
                value: tabCourses.length,
                icon: Layers,
                bg: "bg-indigo-50",
                text: "text-indigo-600",
              },
              {
                label: "In Progress",
                value: tabCourses.filter((c) => c.progress > 0 && c.progress < 100).length,
                icon: Flame,
                bg: "bg-orange-50",
                text: "text-orange-500",
              },
              {
                label: "Completed",
                value: tabCourses.filter((c) => c.progress === 100).length,
                icon: CheckCircle,
                bg: "bg-emerald-50",
                text: "text-emerald-600",
              },
              {
                label: "Locked",
                value: tabCourses.filter((c) => c.is_locked).length,
                icon: Lock,
                bg: "bg-red-50",
                text: "text-red-500",
              },
            ].map(({ label, value, icon: Icon, bg, text }) => (
              <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
                <div className={`w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                  <Icon size={16} className={text} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-800 leading-none">{value}</p>
                  <p className={`text-[11px] font-semibold ${text} mt-0.5`}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "mock" ? "mock exams" : "courses"}…`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition outline-none"
            />
          </div>

          {/* grid */}
          {filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <BookOpen size={28} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">
                No {activeTab === "mock" ? "mock exams" : "courses"} found
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} deptId={id} tab={activeTab} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDepartmentCourses;
