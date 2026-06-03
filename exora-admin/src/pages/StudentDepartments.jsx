import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Lock, Unlock, Computer, Database, Code, Cpu } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50">
      <div className="bg-linear-to-br from-indigo-700 to-sky-500 pb-10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="rounded-4xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl text-white">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-200/70">
                  Student Portal
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                  Select your department
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-100/90">
                  Choose a department to unlock courses, start focused practice,
                  and prepare for your exit exams.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/15 p-4 text-center">
                  <p className="text-xs text-slate-200 uppercase tracking-[0.32em]">
                    Departments
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {departments.length}
                  </p>
                </div>
                <div className="rounded-3xl bg-white/15 p-4 text-center">
                  <p className="text-xs text-slate-200 uppercase tracking-[0.32em]">
                    Unlocked
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{unlockedCount}</p>
                </div>
                <div className="rounded-3xl bg-white/15 p-4 text-center">
                  <p className="text-xs text-slate-200 uppercase tracking-[0.32em]">
                    Locked
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{lockedCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 pb-12">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="space-y-6">
            <div className="rounded-4xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-12 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Jump to department
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        navigate(
                          `/student/departments/${e.target.value}/courses`,
                        );
                    }}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Choose a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {["all", "in-progress", "completed", "locked"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                      selectedFilter === filter
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {filter === "all"
                      ? "All"
                      : filter === "in-progress"
                        ? "In Progress"
                        : filter === "completed"
                          ? "Completed"
                          : "Locked"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDepartments.length === 0 ? (
                <div className="col-span-full rounded-4xl border border-dashed border-slate-300 bg-white/80 p-12 text-center text-slate-500">
                  No departments match your search. Try another keyword or
                  filter.
                </div>
              ) : (
                filteredDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div
                          className={`rounded-3xl p-4 ${dept.isLocked ? "bg-slate-100" : "bg-indigo-100"}`}
                        >
                          {getDepartmentIcon(dept.name)}
                        </div>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                            dept.isLocked
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {dept.isLocked ? (
                            <Lock size={14} />
                          ) : (
                            <Unlock size={14} />
                          )}
                          {dept.isLocked ? "Locked" : "Unlocked"}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {dept.name}
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        {(courseCounts[dept.id] ?? dept.totalCourses ?? dept.courses_count ?? 0).toString()} Courses available
                      </p>

                      {(dept.progress ?? 0) > 0 &&
                        !(dept.isLocked ?? false) && (
                          <div className="mb-5">
                            <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                              <span>Progress</span>
                              <span>{dept.progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-indigo-600"
                                style={{ width: `${dept.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                      {(dept.isLocked ?? false) ? (
                        <Link
                          to="/student/payments"
                          className="block w-full rounded-3xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Unlock Now
                        </Link>
                      ) : (
                        <Link
                          to={`/student/departments/${dept.id}/courses`}
                          className="block w-full rounded-3xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          {(dept.progress ?? 0) > 0
                            ? "Continue Learning"
                            : "Start Learning"}
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                How it works
              </h2>
              <ol className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    1
                  </span>
                  Select a department to open the course path.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    2
                  </span>
                  Upload payment proof for locked departments.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    3
                  </span>
                  Practice questions, mock exams and review your progress.
                </li>
              </ol>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Quick tips
              </h2>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    •
                  </span>
                  Start with unlocked departments for faster progress.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    •
                  </span>
                  Use the search to find departments quickly.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    •
                  </span>
                  Keep an eye on progress bars after you start a department.
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
