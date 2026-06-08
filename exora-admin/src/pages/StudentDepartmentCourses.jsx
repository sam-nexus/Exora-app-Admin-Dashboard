import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  BookOpen,
  Sparkles,
  PlayCircle,
  GraduationCap,
  Lock,
  Unlock,
  FileText,
  Trophy,
  Download,
  Loader2,
  AlertCircle,
  X,
  Gift,
  Clock,
  CheckCircle,
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

const TABS = [
  { key: "regular", label: "Practice", icon: BookOpen },
  { key: "mock", label: "Mock Exams", icon: FileText },
  { key: "exit", label: "Exit Exam", icon: Trophy },
  { key: "materials", label: "Materials", icon: Download },
];

const progressColor = (pct) => {
  if (pct === 0) return "bg-gray-200 dark:bg-gray-600";
  if (pct < 50) return "bg-orange-400";
  if (pct < 100) return "bg-indigo-500";
  return "bg-emerald-500";
};

const CourseCard = ({ course, index, deptId, tab, onUnlockClick }) => {
  const progress = Number(course.progress ?? 0);
  const isLocked = course.is_locked === true;
  const isFree = course.is_free === true;
  const name = course.name || course.title || "Course";

  const getHref = () => {
    if (tab === "mock") return `/student/departments/${deptId}/courses/${course.id}/mock-exam`;
    if (tab === "exit") return `/student/departments/${deptId}/courses/${course.id}/exit-exam`;
    return `/student/departments/${deptId}/courses/${course.id}/practice`;
  };

  const getButtonText = () => {
    if (tab === "mock") return "Start Mock";
    if (tab === "exit") return "Take Exam";
    if (progress > 0 && progress < 100) return "Continue";
    return "Start";
  };

  const getStatusIcon = () => {
    if (progress === 100) return <CheckCircle size={12} className="text-emerald-500" />;
    if (progress > 0) return <Flame size={12} className="text-orange-500" />;
    return <Clock size={12} className="text-gray-400" />;
  };

  const getStatusText = () => {
    if (progress === 100) return "Completed";
    if (progress > 0) return "In Progress";
    return "Not Started";
  };

  const tabColor = tab === "mock" ? "purple" : tab === "exit" ? "emerald" : "indigo";
  const colorMap = {
    indigo: "from-indigo-400 to-indigo-600",
    purple: "from-purple-400 to-purple-600",
    emerald: "from-emerald-400 to-emerald-600",
  };
  const btnColorMap = {
    indigo: "from-indigo-600 to-indigo-700",
    purple: "from-purple-600 to-purple-700",
    emerald: "from-emerald-600 to-emerald-700",
  };

  return (
    <div
      className="group bg-gray-100 dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fadeInUp shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top Gradient Line */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${colorMap[tabColor]}`} />

      <div className="p-5">
        {/* Status Badges Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLocked ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <Lock size={11} /> Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Unlock size={11} /> Unlocked
              </span>
            )}
            {isFree && !isLocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-emerald-400 to-teal-500 px-2.5 py-1 rounded-full shadow-sm animate-bounce-subtle">
                <Sparkles size={10} className="animate-pulse" /> FREE
              </span>
            )}
          </div>
          {!isLocked && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          )}
        </div>

        {/* Course Name */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
          {name}
        </h3>

        {/* Progress Bar */}
        {!isLocked && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Progress</span>
              <span className={`text-[11px] font-bold ${progress === 100 ? "text-emerald-600 dark:text-emerald-400" : progress > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}>
                {progress}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        {isLocked ? (
          <button
            onClick={onUnlockClick}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-500 hover:from-indigo-600 hover:to-indigo-600 text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
          >
            <Lock size={13} /> Unlock Course
          </button>
        ) : (
          <Link
            to={getHref()}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r ${btnColorMap[tabColor]} hover:bg-gradient-to-r hover:brightness-110 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]`}
          >
            {progress > 0 && progress < 100 ? <PlayCircle size={14} /> : <Sparkles size={14} />}
            {getButtonText()}
          </Link>
        )}
      </div>
    </div>
  );
};

const MaterialCard = ({ material }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-600 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 animate-fadeInUp">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center shrink-0">
        <FileText size={18} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{material.title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">PDF Document</p>
        {material.file_url && (
          <a
            href={material.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-2"
          >
            <Download size={12} /> Download
          </a>
        )}
      </div>
    </div>
  </div>
);

const StudentDepartmentCourses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = getUserId();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [department, setDepartment] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("regular");
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [deptsRes, coursesRes] = await Promise.all([
        api.get("/departments"),
        api.get("/courses", { params: { department_id: id } }),
      ]);
      const dept = (deptsRes.data || []).find((d) => d.id.toString() === id);
      setDepartment(dept || { name: "Department" });

      let lockMap = {};
      if (userId) {
        try {
          const userCoursesRes = await api.get(`/courses/user/${userId}`);
          (userCoursesRes.data || []).forEach((uc) => { lockMap[uc.course_id] = uc.is_locked; });
        } catch { }
      }

      const enriched = (coursesRes.data || []).map((course) => {
        const saved = loadCoursePracticeProgress(course.id);
        const progress = saved?.questionCount > 0 ? Math.round(((saved.answeredCount ?? 0) / saved.questionCount) * 100) : 0;
        return { ...course, progress, is_locked: lockMap[course.id] ?? course.is_locked ?? false };
      });

      // Sort: free courses first (for ALL types)
      enriched.sort((a, b) => {
        if (a.is_free && !b.is_free) return -1;
        if (!a.is_free && b.is_free) return 1;
        return 0;
      });

      setAllCourses(enriched);
    } catch (err) {
      setError("Failed to load courses.");
    } finally { setLoading(false); }
  }, [id, userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (activeTab !== "materials" || allCourses.length === 0) return;
    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      try {
        const results = await Promise.all(allCourses.map(async (course) => {
          try {
            const { data } = await api.get(`/courses/${course.id}/materials`);
            return data.map((item) => ({ ...item, courseName: course.name }));
          } catch { return []; }
        }));
        setMaterials(results.flat());
      } catch { } finally { setMaterialsLoading(false); }
    };
    fetchMaterials();
  }, [activeTab, allCourses]);

  const regularCourses = allCourses.filter((c) => !c.type || c.type === "regular");
  const mockCourses = allCourses.filter((c) => c.type === "mock");
  const exitCourses = allCourses.filter((c) => c.type === "exit");

  const getTabCourses = () => {
    if (activeTab === "regular") return regularCourses;
    if (activeTab === "mock") return mockCourses;
    if (activeTab === "exit") return exitCourses;
    return [];
  };

  const tabCourses = getTabCourses();

  // Sort tab courses: free first
  const sortedTabCourses = [...tabCourses].sort((a, b) => {
    if (a.is_free && !b.is_free) return -1;
    if (!a.is_free && b.is_free) return 1;
    return 0;
  });

  const filteredCourses = sortedTabCourses.filter((c) =>
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if current tab has free courses
  const hasFreeCoursesInTab = sortedTabCourses.some(c => c.is_free && !c.is_locked);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
            <BookOpen size={20} className="absolute inset-0 m-auto text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{error}</p>
          <button onClick={fetchData} className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <button
        onClick={() => navigate("/student")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
          <span className="text-indigo-200 text-sm font-medium">Department</span>
        </div>
        <h1 className="text-2xl font-bold">{department?.name}</h1>
        <p className="text-indigo-200 text-sm mt-1">{allCourses.length} courses available</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = key === "regular" ? regularCourses.length : key === "mock" ? mockCourses.length : key === "exit" ? exitCourses.length : 0;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearchTerm(""); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                ${isActive
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
            >
              <Icon size={14} />
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      {activeTab !== "materials" && (
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab === "mock" ? "mock exams" : activeTab === "exit" ? "exit exams" : "courses"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === "materials" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Download size={18} className="text-indigo-600 dark:text-indigo-400" />
            Course Materials
          </h2>
          {materialsLoading ? (
            <div className="text-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No materials available</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back later for study materials</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(
                materials.reduce((acc, m) => {
                  if (!acc[m.courseName]) acc[m.courseName] = [];
                  acc[m.courseName].push(m);
                  return acc;
                }, {})
              ).map(([courseName, courseMaterials]) => (
                <div key={courseName} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{courseName}</h3>
                  </div>
                  <div className="p-4 space-y-2">{courseMaterials.map((m, i) => <MaterialCard key={i} material={m} />)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Free Banner */}
      {activeTab !== "materials" && hasFreeCoursesInTab && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-fadeInUp">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
            <Gift size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
              Free {activeTab === "mock" ? "Mock Exams" : activeTab === "exit" ? "Exit Exams" : "Courses"} Available!
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">
              Start learning instantly with these free {activeTab === "mock" ? "mock exams" : activeTab === "exit" ? "exit exams" : "courses"}
            </p>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {activeTab !== "materials" && (
        filteredCourses.length === 0 ? (
          <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No {activeTab === "mock" ? "mock exams" : activeTab === "exit" ? "exit exams" : "courses"} found
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                index={i}
                deptId={id}
                tab={activeTab}
                onUnlockClick={() => navigate("/student/payments")}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default StudentDepartmentCourses;