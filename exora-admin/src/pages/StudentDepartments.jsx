import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Lock, Unlock, Computer, Database, Code, Cpu, BookOpen } from 'lucide-react';
import api from '../api/axios';

const StudentDepartments = () => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [courseCounts, setCourseCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const [{ data: departmentsData }, { data: coursesData }] = await Promise.all([
        api.get('/departments'),
        api.get('/courses'),
      ]);

      
      setDepartments(departmentsData || []);

      const counts = (coursesData || []).reduce((acc, course) => {
        const deptId = course.department_id || course.departments?.id || course.department?.id;
        if (!deptId) return acc;
        acc[deptId] = (acc[deptId] || 0) + 1;
        return acc;
      }, {});

      setCourseCounts(counts);
    } catch (error) {
      console.error('Error fetching departments or courses:', error);
    } finally {
      setLoading(false);
    }
  };
  const getDepartmentIcon = (name) => {
    const icons = {
      'Information Technology': <Computer className="w-12 h-12" />,
      'Computer Science': <Code className="w-12 h-12" />,
      'Software Engineering': <Database className="w-12 h-12" />,
    };
    return icons[name] || <Cpu className="w-12 h-12" />;
  };

  const filteredDepartments = departments
    .filter((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((dept) => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'in-progress') return dept.progress > 0 && dept.progress < 100;
      if (selectedFilter === 'completed') return dept.progress === 100;
      if (selectedFilter === 'locked') return dept.isLocked;
      return true;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const unlockedCount = departments.filter((dept) => !(dept.isLocked ?? false)).length;
  const lockedCount = departments.filter((dept) => dept.isLocked ?? false).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-linear-to-br from-indigo-700 via-purple-600 to-blue-500 pb-10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md text-white">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎓</span>
                  <p className="text-xs uppercase tracking-widest text-indigo-100 font-semibold">
                    Student Learning Hub
                  </p>
                </div>
                <h1 className="mt-3 text-5xl font-bold tracking-tight text-white">
                  Select Your Department
                </h1>
                <p className="mt-4 text-base leading-7 text-indigo-100">
                  Choose a department to unlock courses, practice questions, master concepts,
                  and prepare for your exit exams. Your learning journey awaits! ✨
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/15 border border-white/30 p-5 text-center hover:bg-white/20 transition backdrop-blur">
                  <p className="text-xs text-indigo-100 uppercase tracking-widest font-bold">
                    📚 Total
                  </p>
                  <p className="mt-4 text-4xl font-bold text-white">
                    {departments.length}
                  </p>
                  <p className="text-xs text-indigo-100 mt-2">Departments</p>
                </div>
                <div className="rounded-2xl bg-white/15 border border-white/30 p-5 text-center hover:bg-white/20 transition backdrop-blur">
                  <p className="text-xs text-green-100 uppercase tracking-widest font-bold">
                    🔓 Unlocked
                  </p>
                  <p className="mt-4 text-4xl font-bold text-white">{unlockedCount}</p>
                  <p className="text-xs text-green-100 mt-2">Available Now</p>
                </div>
                <div className="rounded-2xl bg-white/15 border border-white/30 p-5 text-center hover:bg-white/20 transition backdrop-blur">
                  <p className="text-xs text-orange-100 uppercase tracking-widest font-bold">
                    🔒 Locked
                  </p>
                  <p className="mt-4 text-4xl font-bold text-white">{lockedCount}</p>
                  <p className="text-xs text-orange-100 mt-2">Unlock Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 pb-12">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-12 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🚀 Quick Jump
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        navigate(
                          `/student/departments/${e.target.value}/courses`,
                        );
                    }}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-medium"
                  >
                    <option value="">Choose a department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {["all", "in-progress", "completed", "locked"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      selectedFilter === filter
                        ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-300 scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter === "all"
                      ? "📋 All"
                      : filter === "in-progress"
                        ? "⏳ In Progress"
                        : filter === "completed"
                          ? "✅ Completed"
                          : "🔒 Locked"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDepartments.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold">No departments found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filter</p>
                </div>
              ) : (
                filteredDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className={`overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                      dept.isLocked
                        ? "border border-gray-300 bg-white"
                        : "border border-indigo-200 bg-linear-to-br from-white to-indigo-50"
                    }`}
                  >
                    {/* Top Progress Bar */}
                    {!dept.isLocked && (dept.progress ?? 0) > 0 && (
                      <div className="h-1.5 bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${dept.progress}%` }}
                        />
                      </div>
                    )}
                    {dept.isLocked && <div className="h-1.5 bg-gray-200" />}

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div
                          className={`rounded-2xl p-3 shadow-sm ${
                            dept.isLocked
                              ? "bg-gray-100"
                              : "bg-linear-to-br from-indigo-100 to-purple-100"
                          }`}
                        >
                          {getDepartmentIcon(dept.name)}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                            dept.isLocked
                              ? "bg-orange-100 text-orange-700 border border-orange-200"
                              : "bg-green-100 text-green-700 border border-green-200"
                          }`}
                        >
                          {dept.isLocked ? (
                            <>
                              <Lock size={12} />
                              Locked
                            </>
                          ) : (
                            <>
                              <Unlock size={12} />
                              Unlocked
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {dept.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 font-medium">
                        📚 {(courseCounts[dept.id] ?? dept.totalCourses ?? dept.courses_count ?? 0).toString()} Courses Available
                      </p>

                      {(dept.progress ?? 0) > 0 &&
                        !(dept.isLocked ?? false) && (
                          <div className="mb-5 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="font-semibold text-gray-700">Progress</span>
                              <span className="font-bold text-indigo-600 text-base">{dept.progress}%</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 shadow-inner">
                              <div
                                className="h-full bg-linear-to-r from-indigo-500 to-purple-500 shadow-sm"
                                style={{ width: `${dept.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                      {(dept.isLocked ?? false) ? (
                        <Link
                          to="/student/payments"
                          className="block w-full rounded-xl bg-linear-to-r from-orange-600 to-orange-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:shadow-lg hover:shadow-orange-300 hover:scale-105"
                        >
                          🔓 Unlock Now
                        </Link>
                      ) : (
                        <Link
                          to={`/student/departments/${dept.id}/courses`}
                          className="block w-full rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:shadow-lg hover:shadow-indigo-300 hover:scale-105"
                        >
                          {(dept.progress ?? 0) > 0
                            ? "📖 Continue Learning"
                            : "🚀 Start Learning"}
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-linear-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-6 shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📖</span> How it Works
              </h2>
              <ol className="space-y-4 text-sm text-gray-700">
                <li className="flex gap-3 items-start">
                  <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold">
                    1
                  </span>
                  <span className="pt-1"><span className="font-semibold">Select a department</span> to explore the course path and unlock content.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold">
                    2
                  </span>
                  <span className="pt-1"><span className="font-semibold">Upload payment proof</span> to unlock premium departments.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold">
                    3
                  </span>
                  <span className="pt-1"><span className="font-semibold">Practice & master</span> with questions, mock exams & reviews.</span>
                </li>
              </ol>
            </div>

            <div className="rounded-2xl bg-linear-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-6 shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span> Pro Tips
              </h2>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3 items-start">
                  <span className="mt-1 text-xl shrink-0">⚡</span>
                  <span><span className="font-semibold">Start unlocked departments</span> first for fast progress.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 text-xl shrink-0">🔍</span>
                  <span><span className="font-semibold">Use quick jump</span> to navigate departments instantly.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 text-xl shrink-0">📊</span>
                  <span><span className="font-semibold">Watch progress bars</span> to track your learning journey.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StudentDepartments;
