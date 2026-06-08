import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getUserId } from '../utils/auth';
import { Loader2, Lock, Unlock, Search, X, Sparkles, BookOpen, ChevronRight, Gift } from 'lucide-react';
import 'index.css';

const StudentCourses = () => {
  const userId = getUserId();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get(`/courses/user/${userId}`);
        const sorted = (data || []).sort((a, b) => {
          const aFree = a.courses?.is_free || false;
          const bFree = b.courses?.is_free || false;
          if (aFree && !bFree) return -1;
          if (!aFree && bFree) return 1;
          return 0;
        });
        setCourses(sorted);
      } catch (err) {
        setError('Unable to load courses');
      } finally { setLoading(false); }
    };
    if (userId) fetchCourses();
  }, [userId]);

  const filteredCourses = courses.filter((c) =>
    (c.courses?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
            <BookOpen size={20} className="absolute inset-0 m-auto text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {courses.length} course{courses.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <span className="text-lg">⚠️</span> {error}
        </div>
      )}

      {/* Free Courses Banner */}
      {courses.filter(c => c.courses?.is_free).length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md animate-pulse">
            <Gift size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Free Courses Available!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Start learning instantly with these free courses</p>
          </div>
        </div>
      )}

      {/* Course List */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No courses found</p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course, index) => {
            const isLocked = course.is_locked;
            const isFree = course.courses?.is_free;
            const name = course.courses?.name || 'Course';
            const departmentName = course.courses?.departments?.name || '';

            return (
              <div
                key={course.course_id}
                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 animate-fadeInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                  {/* Icon + Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className={`relative shrink-0 ${isLocked ? '' : 'group-hover:scale-110 transition-transform duration-300'}`}>
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${isLocked
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700'
                          : 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 group-hover:shadow-md'
                        }`}
                      >
                        {isLocked ? (
                          <Lock size={22} className="text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Unlock size={22} className="text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                      {/* Free Badge */}
                      {isFree && !isLocked && (
                        <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-full px-2 py-0.5 shadow-lg animate-bounce-subtle">
                          <div className="flex items-center gap-0.5">
                            <Sparkles size={10} className="animate-pulse" />
                            <span className="text-[9px] font-bold tracking-wide">FREE</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                          {name}
                        </h3>
                        {isFree && !isLocked && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-medium">
                            <Sparkles size={10} /> Free Course
                          </span>
                        )}
                      </div>
                      {departmentName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{departmentName}</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {isLocked ? '🔒 Unlock to access this course' : '✅ Ready for practice'}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="sm:ml-auto shrink-0">
                    {isLocked ? (
                      <Link
                        to="/student/payments"
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm hover:shadow-md"
                      >
                        <Lock size={14} /> Unlock
                      </Link>
                    ) : (
                      <Link
                        to={`/student/departments/${course.courses?.department_id}/courses`}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                      >
                        Start Learning <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Progress Bar (only for unlocked courses) */}
                {!isLocked && (
                  <div className="h-1 bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCourses;