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

      {/* Department Header - Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={24} />
              <span className="text-indigo-100 text-sm">Department</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              {department?.name}
            </h1>
            <p className="text-indigo-100">
              {courses.length} Courses • {completedCount} Completed
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center min-w-[180px]">
            <p className="text-indigo-100 text-sm mb-1">Overall Progress</p>
            <p className="text-4xl font-bold">{totalProgress}%</p>
            <div className="mt-3 w-full bg-white/30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
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
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Department Progress</span>
          <span className="font-semibold text-indigo-600">
            {totalProgress}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-2xl font-bold text-indigo-600">
                {visibleItems.length}
              </p>
              <p className="text-sm text-gray-500">
                Total {activeTab === "mock" ? "Exams" : "Courses"}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-2xl font-bold text-orange-600">
                {
                  visibleItems.filter((c) => c.progress > 0 && c.progress < 100)
                    .length
                }
              </p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-2xl font-bold text-green-600">
                {visibleItems.filter((c) => c.progress === 100).length}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-1">
                <BarChart3 size={18} className="text-gray-400" />
                <p className="text-2xl font-bold text-gray-700">
                  {activeTab === 'mock' ? (visibleItems.length > 0 ? Math.round(visibleItems.reduce((sum, c) => sum + Number(c.progress ?? 0), 0) / visibleItems.length) : 0) : totalProgress}%
                </p>
              </div>
              <p className="text-sm text-gray-500">Avg Progress</p>
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
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Top Progress Bar */}
                  <div className="h-1 bg-gray-100">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${course.progress ?? 0}%` }}
                    />
                  </div>

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <span className="text-indigo-600 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          of {filteredCourses.length}
                        </span>
                      </div>
                      {getStatusBadge(course.progress)}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition line-clamp-1">
                      {course.title || course.name || course.courses?.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {course.description ||
                        course.summary ||
                        "A model mock exam to help you prepare for the final exit exam."}
                    </p>

                    {/* Progress Details */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-indigo-600">
                          {course.progress ?? 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {activeTab === "courses" ? (
                        <Link
                          to={`/student/departments/${id}/courses/${course.id}/practice`}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all group/btn"
                        >
                          <PlayCircle
                            size={16}
                            className="group-hover/btn:scale-110 transition"
                          />
                          Practice
                        </Link>
                      ) : (
                        <Link
                          to={`/student/departments/${id}/courses/${course.id}/mock-exam`}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all group/btn"
                        >
                          <Sparkles
                            size={16}
                            className="group-hover/btn:scale-110 transition"
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
