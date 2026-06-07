import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Award,
  BookOpen,
  Clock,
  CheckCircle,
  TrendingUp,
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
  Eye,
  Download,
  Loader2,
  AlertCircle,
  X,
  File,
  Image,
  FileUp,
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
  { key: "regular", label: "Practice", icon: BookOpen },
  { key: "mock", label: "Mock Exams", icon: FileText },
  { key: "exit", label: "Exit Exam", icon: Trophy },
  { key: "materials", label: "Materials", icon: Download },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const progressColor = (pct) => {
  if (pct === 0) return "bg-gray-200";
  if (pct < 50) return "bg-orange-400";
  if (pct < 100) return "bg-indigo-500";
  return "bg-emerald-500";
};

const getFileIcon = (fileType) => {
  if (fileType?.includes("pdf")) return <FileText size={16} className="text-red-500" />;
  if (fileType?.includes("image")) return <Image size={16} className="text-purple-500" />;
  if (fileType?.includes("video")) return <PlayCircle size={16} className="text-blue-500" />;
  return <File size={16} className="text-gray-500" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const StatusPill = ({ progress }) => {
  const v = Number(progress ?? 0);
  if (v === 0) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"><Clock size={10}/>Not started</span>;
  if (v === 100) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle size={10}/>Completed</span>;
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><Flame size={10}/>In progress</span>;
};

// ─── Course Card ──────────────────────────────────────────────────────────────
const CourseCard = ({ course, index, deptId, tab, onUnlockClick }) => {
  const progress = Number(course.progress ?? 0);
  const isLocked = course.is_locked === true;
  const name = course.name || course.title || "Course";

  const getTabColor = () => {
    if (tab === "mock") return "purple";
    if (tab === "exit") return "emerald";
    return "indigo";
  };

  const getButtonText = () => {
    if (tab === "mock") return "Start Mock Exam";
    if (tab === "exit") return "Take Exit Exam";
    if (progress > 0 && progress < 100) return "Continue Practice";
    return "Start Practice";
  };

  const getButtonIcon = () => {
    if (tab === "mock" || tab === "exit") return <Sparkles size={13} />;
    if (progress > 0 && progress < 100) return <PlayCircle size={13} />;
    return <PlayCircle size={13} />;
  };

  const getHref = () => {
    if (tab === "mock") return `/student/departments/${deptId}/courses/${course.id}/mock-exam`;
    if (tab === "exit") return `/student/departments/${deptId}/courses/${course.id}/exit-exam`;
    return `/student/departments/${deptId}/courses/${course.id}/practice`;
  };

  const tabColor = getTabColor();
  const colorClasses = {
    indigo: "from-indigo-400 to-indigo-600",
    purple: "from-purple-400 to-purple-600",
    emerald: "from-emerald-400 to-emerald-600",
  };

  return (
    <div className={`group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden
      ${isLocked
        ? "border-gray-200 hover:border-gray-300 hover:shadow-md"
        : "border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${colorClasses[tabColor]}`} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-medium shadow-sm
              ${tab === "mock" ? "bg-purple-500" : tab === "exit" ? "bg-emerald-500" : "bg-indigo-500"}`}>
              {index + 1}
            </div>
            <StatusPill progress={progress} />
          </div>

          {isLocked ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <Lock size={9} /> Locked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Unlock size={9} /> Unlocked
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors">
          {name}
        </h3>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400">Progress</span>
            <span className={`text-[10px] font-semibold ${progress === 100 ? "text-emerald-600" : progress > 0 ? "text-orange-500" : "text-gray-400"}`}>
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

        {isLocked ? (
          <button
            onClick={onUnlockClick}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-200 transition active:scale-95 cursor-pointer"
          >
            <Lock size={12} /> Unlock Course
          </button>
        ) : (
          <Link
            to={getHref()}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-all
              ${tab === "mock" ? "bg-purple-600 hover:bg-purple-700" : tab === "exit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"}
              hover:shadow-sm active:scale-95`}
          >
            {getButtonIcon()}
            {getButtonText()}
          </Link>
        )}
      </div>
    </div>
  );
};

// ─── Material Card Component ──────────────────────────────────────────────────
const MaterialCard = ({ material }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition">
    <div className="flex items-start gap-3">
      <div className="shrink-0">
        {getFileIcon(material.file_type)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-800 truncate">{material.title}</h4>
        {material.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{material.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
          {material.file_size && <span>{formatFileSize(material.file_size)}</span>}
          {material.file_type && <span>{material.file_type.toUpperCase()}</span>}
        </div>
      </div>
      {material.file_url && (
        <a
          href={material.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 transition"
        >
          <Download size={14} />
        </a>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
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

  // Fetch department and courses
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
          (userCoursesRes.data || []).forEach((uc) => {
            lockMap[uc.course_id] = uc.is_locked;
          });
        } catch {
          // ignore
        }
      }

      const enriched = (coursesRes.data || []).map((course) => {
        const saved = loadCoursePracticeProgress(course.id);
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
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch materials
  useEffect(() => {
    if (activeTab !== "materials" || allCourses.length === 0) return;
    
    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      try {
        const results = await Promise.all(
          allCourses.map(async (course) => {
            try {
              const { data } = await api.get(`/courses/${course.id}/materials`);
              return data.map(item => ({ ...item, courseName: course.name }));
            } catch {
              return [];
            }
          })
        );
        setMaterials(results.flat());
      } catch (err) {
        console.error('Error fetching materials:', err);
      } finally {
        setMaterialsLoading(false);
      }
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
  const filteredCourses = tabCourses.filter((c) =>
    (c.name || c.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedRegular = regularCourses.filter((c) => c.progress === 100).length;
  const totalRegular = regularCourses.length;
  const overallProgress = totalRegular > 0
    ? Math.round(regularCourses.reduce((s, c) => s + c.progress, 0) / totalRegular)
    : 0;
  const isExitReady = completedRegular === totalRegular && totalRegular > 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={28} className="animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500">Loading courses...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Back button */}
      <button
        onClick={() => navigate("/student/departments")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" />
        Back to Departments
      </button>

      {/* Department Header */}
      <div className="bg-gray-800 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                <GraduationCap size={14} />
              </div>
              <span className="text-gray-300 text-xs font-medium uppercase tracking-wider">Department</span>
            </div>
            <h1 className="text-2xl font-bold">{department?.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-300">
              <span className="flex items-center gap-1"><Layers size={12} />{totalRegular} courses</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span className="flex items-center gap-1"><CheckCircle size={12} />{completedRegular} completed</span>
            </div>
          </div>

          <div className="shrink-0 bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[140px] text-center">
            <p className="text-gray-300 text-[10px] font-medium uppercase tracking-wider mb-1">Overall Progress</p>
            <p className="text-3xl font-bold">{overallProgress}<span className="text-sm text-gray-300">%</span></p>
            <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = activeTab === key ? tabCourses.length : 
                        key === "regular" ? regularCourses.length :
                        key === "mock" ? mockCourses.length :
                        key === "exit" ? exitCourses.length : 0;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearchTerm(""); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150
                ${isActive
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Icon size={14} />
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-gray-100 text-gray-600" : "bg-gray-200 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Exit Exam Tab */}
      {activeTab === "exit" && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Department Exit Exam</h2>
                <p className="text-sm text-gray-600">
                  Complete all {totalRegular} practice courses to unlock this exam and earn your certificate.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 max-w-xs h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: totalRegular > 0 ? `${(completedRegular / totalRegular) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {completedRegular} / {totalRegular}
                  </span>
                </div>
              </div>
            </div>

            <Link
              to={`/student/departments/${id}/exit-exam`}
              onClick={(e) => { if (!isExitReady) e.preventDefault(); }}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all
                ${isExitReady
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              <Award size={15} />
              {isExitReady ? "Take Exit Exam" : "Complete courses first"}
            </Link>
          </div>

          {/* Exit Exam Courses */}
          {exitCourses.length > 0 && (
            <div className="mt-5 pt-4 border-t border-emerald-200">
              <p className="text-xs font-medium text-gray-500 mb-3">Preparation Courses</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {exitCourses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} deptId={id} tab="exit" onUnlockClick={() => navigate("/student/payments")} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === "materials" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Download size={18} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Course Materials</h2>
          </div>
          
          {materialsLoading ? (
            <div className="text-center py-10">
              <Loader2 size={24} className="animate-spin text-gray-400 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No materials available</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for study materials</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group materials by course */}
              {Object.entries(
                materials.reduce((acc, m) => {
                  if (!acc[m.courseName]) acc[m.courseName] = [];
                  acc[m.courseName].push(m);
                  return acc;
                }, {})
              ).map(([courseName, courseMaterials]) => (
                <div key={courseName} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-800">{courseName}</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {courseMaterials.map((material, idx) => (
                      <MaterialCard key={idx} material={material} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Regular / Mock Tabs */}
      {(activeTab === "regular" || activeTab === "mock") && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox
              label="Total"
              value={tabCourses.length}
              icon={<Layers size={14} />}
              color="gray"
            />
            <StatBox
              label="In Progress"
              value={tabCourses.filter(c => c.progress > 0 && c.progress < 100).length}
              icon={<Flame size={14} />}
              color="orange"
            />
            <StatBox
              label="Completed"
              value={tabCourses.filter(c => c.progress === 100).length}
              icon={<CheckCircle size={14} />}
              color="green"
            />
            <StatBox
              label="Locked"
              value={tabCourses.filter(c => c.is_locked).length}
              icon={<Lock size={14} />}
              color="red"
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "mock" ? "mock exams" : "courses"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Course Grid */}
          {filteredCourses.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-center bg-gray-50 rounded-xl">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <BookOpen size={24} className="text-gray-300" />
              </div>
              <p className="font-medium text-gray-500">
                No {activeTab === "mock" ? "mock exams" : "courses"} found
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCourses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} deptId={id} tab={activeTab} onUnlockClick={() => navigate("/student/payments")} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Helper Components
const StatBox = ({ label, value, icon, color }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
      <div className={`w-8 h-8 ${colors[color]} rounded-lg flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
    </div>
  );
};

export default StudentDepartmentCourses;