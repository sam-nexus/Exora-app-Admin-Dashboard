import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Trash2 } from 'lucide-react';

const Courses = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [courses, setCourses] = useState([]);
  const [newCourseName, setNewCourseName] = useState('');

  useEffect(() => {
    api.get('/departments').then(res => setDepartments(res.data));
  }, []);

  const fetchCourses = async () => {
    if (!selectedDept) return;
    const res = await api.get(`/courses?department_id=${selectedDept}`);
    setCourses(res.data);
  };

  useEffect(() => { fetchCourses(); }, [selectedDept]);

  const addCourse = async () => {
    if (!newCourseName.trim()) return;
    await api.post('/courses', { department_id: selectedDept, name: newCourseName });
    setNewCourseName('');
    fetchCourses();
  };

  const deleteCourse = async (id) => {
    await api.delete(`/courses/${id}`);
    fetchCourses();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Courses</h2>
      <div className="flex gap-4 mb-6">
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="p-3 border rounded-lg">
          <option value="">Select Department</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {selectedDept && (
          <div className="flex gap-2">
            <input
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="New course name"
              className="p-3 border rounded-lg"
            />
            <button onClick={addCourse} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">Add Course</button>
          </div>
        )}
      </div>

      {selectedDept && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {courses.length === 0 ? (
            <p className="text-gray-500">No courses in this department.</p>
          ) : (
            courses.map(c => (
              <div key={c.id} className="flex justify-between items-center py-3 border-b last:border-0">
                <span>{c.name}</span>
                <button onClick={() => deleteCourse(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
export default Courses;