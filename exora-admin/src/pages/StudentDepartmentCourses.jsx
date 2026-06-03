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
  BarChart3,
} from "lucide-react";
import api from "../api/axios";

const getPracticeProgressKey = (courseId) => `practice-progress:${courseId}`;

const loadCoursePracticeProgress = (courseId) => {
  if (!courseId) return null;
  try {
    const cached = localStorage.getItem(getPracticeProgressKey(courseId));
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error("Failed to read course practice progress:", err);
    return null;
  }
};

const StudentDepartmentCourses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [mockItems, setMockItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("courses");

  useEffect(() => {
    const fetchDepartmentAndCourses = async () => {
      try {
        const departmentsRes = await api.get("/departments");
        const dept = departmentsRes.data.find(
          (dept) => dept.id.toString() === id,
        );

        const isModelCategory = /model/i.test(dept?.name || "");
        const isExitCategory = /exit/i.test(dept?.name || "");

        const coursesRes = await api.get(
          "/courses",
          isModelCategory || isExitCategory
            ? undefined
            : { params: { department_id: id } },
        );

        const allCourses = (coursesRes.data || []).map((course) => {
          const savedProgress = loadCoursePracticeProgress(course.id);
          const progressFromSaved =
            savedProgress?.questionCount > 0
              ? Math.round(
                  ((savedProgress.answeredCount ?? 0) / savedProgress.questionCount) * 100,
                )
              : undefined;

          return {
            ...course,
            savedProgress,
            progress:
              progressFromSaved !== undefined
                ? progressFromSaved
                : Number(course.progress ?? 0),
          };
        });

        const mockItemsData = isModelCategory
          ? [
              {
                id: 'mock-category',
                title: dept?.name || 'Mock Exams',
                description: `Model exam category for ${dept?.name || 'this department'}`,
                actionLabel: 'Open Model Exams',
                progress: 0,
              },
            ]
          : allCourses
              .filter((course) => {
                const text = `${course.title || course.name || course.summary || course.description || ""}`;
                return /\b(mock|model)\b/i.test(text);
              })
              .map((course) => ({
                ...course,
                title: `${course.title || course.name || course.courses?.name} Mock Exam`,
                description:
                  course.summary || course.description ||
                  'A department mock exam item for exam preparation.',
                actionLabel: 'Start Mock Exam',
              }));

        setDepartment(dept || { name: "Department" });
        setCourses(allCourses);
        setMockItems(mockItemsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDepartmentAndCourses();
    }
  }, [id]);

  const getStatusBadge = (progress) => {
    const value = Number(progress ?? 0);
    if (value === 0)
      return (
        <span className="flex items-center gap-1 text-blue-600 text-xs font-medium bg-blue-50 px-2.5 py-1 rounded-full">
          <Clock size={12} /> Not Started
        </span>
      );
    if (value === 100)
      return (
        <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2.5 py-1 rounded-full">
          <CheckCircle size={12} /> Completed
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-orange-600 text-xs font-medium bg-orange-50 px-2.5 py-1 rounded-full">
        <TrendingUp size={12} /> In Progress
      </span>
    );
  };

  const isModelCategory = /model/i.test(department?.name || "");
  const isExitCategory = /exit/i.test(department?.name || "");

  const visibleItems = activeTab === 'mock' ? mockItems : courses;

  console.log({
    department,
    activeTab,
    visibleItems,
    isModelCategory,
    isExitCategory,
  });

  const filteredCourses = visibleItems
    .filter((course) => {
      const value = Number(course.progress ?? 0);
      if (filter === "in-progress") return value > 0 && value < 100;
      if (filter === "completed") return value === 100;
      if (filter === "not-started") return value === 0;
      return true;
    })
    .filter((course) => {
      const title = (course.title || course.name || course.courses?.name || "")
        .toString()
        .toLowerCase();
      return title.includes(searchTerm.toLowerCase());
    });

  const totalProgress =
    visibleItems.length > 0
      ? Math.round(
          visibleItems.reduce((sum, c) => sum + Number(c.progress ?? 0), 0) /
            visibleItems.length,
        )
      : 0;

  const completedCount = courses.filter(
    (c) => Number(c.progress ?? 0) === 100,
  ).length;
  const isExitExamReady =
    completedCount === courses.length && courses.length > 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/student/departments")}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition group"
      >
        <ArrowLeft
          size={18}
          className="group-hover:-translate-x-1 transition"
        />
        <span>Back to Departments</span>
      </button>

      {/* Department Header - Enhanced Gradient */}
      <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={24} className="text-indigo-200" />
              <span className="text-indigo-100 text-sm font-semibold tracking-wide">DEPARTMENT</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-2">
              {department?.name}
            </h1>
            <p className="text-indigo-100 flex gap-4">
              <span>📚 {courses.length} Courses</span>
              <span>✅ {completedCount} Completed</span>
              <span>🎯 {courses.length - completedCount} Remaining</span>
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center min-w-[200px] border border-white/20 shadow-xl">
            <p className="text-indigo-100 text-sm mb-2 font-semibold uppercase">Overall Progress</p>
            <div className="flex items-baseline justify-center gap-1">
              <p className="text-5xl font-bold">{totalProgress}</p>
              <p className="text-2xl text-indigo-200">%</p>
            </div>
            <div className="mt-4 w-full bg-white/20 rounded-full h-2.5 border border-white/30">
              <div
                className="bg-linear-to-r from-yellow-300 to-yellow-200 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <p className="text-xs text-indigo-100 mt-2">{totalProgress === 100 ? '🎉 Mastered!' : 'Keep going!'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "courses", label: "Courses", icon: <BookOpen size={18} /> },
          { key: "mock", label: "Mock Exam", icon: <Sparkles size={18} /> },
          { key: "exit", label: "Exit Exam", icon: <Target size={18} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-lg font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-indigo-600 border-t border-l border-r border-gray-200 shadow-sm"
                : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between text-sm text-gray-700 mb-3">
          <span className="font-semibold flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-600" />
            Department Progress
          </span>
          <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {totalProgress}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className="bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 {totalProgress === 100 ? 'Perfect! You\'ve completed all courses!' : `${100 - totalProgress}% to go - Keep practicing!`}
        </p>
      </div>

      {/* Exit Exam Tab Content */}
      {activeTab === "exit" && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-500 rounded-full p-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Department Exit Exam
                </h2>
                <p className="text-gray-600 mt-1">
                  Complete all {courses.length} courses to unlock the exit exam
                  and earn your certificate.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(completedCount / courses.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {completedCount}/{courses.length} Courses
                  </span>
                </div>
              </div>
            </div>
            <Link
              to={`/student/departments/${id}/exit-exam`}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                isExitExamReady
                  ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (!isExitExamReady) e.preventDefault();
              }}
            >
              <Award size={18} />
              {isExitExamReady
                ? "Take Exit Exam"
                : "Complete All Courses First"}
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Courses/Mock Tab Content */}
      {(activeTab === "courses" || activeTab === "mock") && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <BookOpen size={20} className="text-blue-600" />
                <p className="text-sm text-blue-600 font-semibold">Total</p>
              </div>
              <p className="text-3xl font-bold text-blue-700">
                {visibleItems.length}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {activeTab === "mock" ? "Mock Exams" : "Courses"}
              </p>
            </div>

            <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm border border-orange-200 p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={20} className="text-orange-600" />
                <p className="text-sm text-orange-600 font-semibold">Active</p>
              </div>
              <p className="text-3xl font-bold text-orange-700">
                {
                  visibleItems.filter((c) => Number(c.progress ?? 0) > 0 && Number(c.progress ?? 0) < 100)
                    .length
                }
              </p>
              <p className="text-xs text-orange-600 mt-1">In Progress</p>
            </div>

            <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle size={20} className="text-green-600" />
                <p className="text-sm text-green-600 font-semibold">Done</p>
              </div>
              <p className="text-3xl font-bold text-green-700">
                {visibleItems.filter((c) => Number(c.progress ?? 0) === 100).length}
              </p>
              <p className="text-xs text-green-600 mt-1">Completed</p>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 size={20} className="text-purple-600" />
                <p className="text-sm text-purple-600 font-semibold">Avg</p>
              </div>
              <p className="text-3xl font-bold text-purple-700">
                {activeTab === 'mock' ? (visibleItems.length > 0 ? Math.round(visibleItems.reduce((sum, c) => sum + Number(c.progress ?? 0), 0) / visibleItems.length) : 0) : totalProgress}%
              </p>
              <p className="text-xs text-purple-600 mt-1">Progress</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "mock" ? "mock exams" : "courses"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {["all", "in-progress", "completed", "not-started"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filter === f
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {f === "all"
                      ? "All"
                      : f === "in-progress"
                        ? "In Progress"
                        : f === "completed"
                          ? "Completed"
                          : "Not Started"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">
                No {activeTab === "mock" ? "exams" : "courses"} found
              </h3>
              <p className="text-gray-400 mt-2">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Top Progress Bar */}
                  <div className="h-1 bg-gray-100">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${course.progress ?? 0}%` }}
                    />
                  </div>

                  <div className="p-6">
                    {/* Header with Badge */}
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          {index + 1} of {filteredCourses.length}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {/* Type Badge */}
                        {course.type === 'mock' && (
                          <span className="inline-flex items-center gap-1 text-purple-700 text-xs font-bold bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">
                            📝 Mock
                          </span>
                        )}
                        {course.type === 'exit' && (
                          <span className="inline-flex items-center gap-1 text-green-700 text-xs font-bold bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                            🎓 Exit
                          </span>
                        )}
                        {(!course.type || course.type === 'regular') && (
                          <span className="inline-flex items-center gap-1 text-blue-700 text-xs font-bold bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
                            📚 Regular
                          </span>
                        )}
                        {getStatusBadge(course.progress)}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition line-clamp-2">
                      {course.title || course.name || course.courses?.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {course.description ||
                        course.summary ||
                        "A model mock exam to help you prepare for the final exit exam."}
                    </p>

                    {/* Progress Details */}
                    <div className="mb-5 bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Progress</span>
                        <span className="font-bold text-indigo-600 text-base">
                          {course.progress ?? 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-linear-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${course.progress ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {activeTab === "courses" ? (
                        <Link
                          to={`/student/departments/${id}/courses/${course.id}/practice`}
                          className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-indigo-600 to-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-300 hover:scale-105 transition-all group/btn"
                        >
                          <PlayCircle
                            size={16}
                            className="group-hover/btn:scale-125 transition"
                          />
                          Practice
                        </Link>
                      ) : (
                        <Link
                          to={`/student/departments/${id}/courses/${course.id}/mock-exam`}
                          className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-purple-600 to-purple-600 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-300 hover:scale-105 transition-all group/btn"
                        >
                          <Sparkles
                            size={16}
                            className="group-hover/btn:scale-125 transition"
                          />
                          Mock Exam
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDepartmentCourses;
