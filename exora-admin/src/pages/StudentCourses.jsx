import { useEffect, useState } from 'react';
import api from '../api/axios';
import { getUserId } from '../utils/auth';
import { Loader2, BookOpen, CheckCircle2 } from 'lucide-react';

const StudentCourses = () => {
  const userId = getUserId();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get(`/courses/user/${userId}`);
        setCourses(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load courses');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchCourses();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your Course Plan</h1>
        <p className="text-slate-500 mt-2">View and track all courses assigned for your exam preparation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Total courses</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{courses.length}</p>
          <p className="mt-2 text-slate-500">Courses in your exam prep list.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Unlocked</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{courses.filter((course) => !course.is_locked).length}</p>
          <p className="mt-2 text-slate-500">Courses ready for active practice.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Locked</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{courses.filter((course) => course.is_locked).length}</p>
          <p className="mt-2 text-slate-500">Courses waiting for approval or payment.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Course details</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading courses...</div>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-600">No courses assigned yet. Please contact your admin.</p>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.course_id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{course.courses?.name || 'Course'}</p>
                    <p className="text-sm text-slate-500">Department: {course.courses?.department_id || 'N/A'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${course.is_locked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {course.is_locked ? 'Locked' : 'Unlocked'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-slate-600 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-slate-200">
                    <CheckCircle2 size={16} /> Practice available
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Exam goal ready</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
