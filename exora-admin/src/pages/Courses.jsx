import { useState, useEffect } from 'react';
import api from '../api/axios';

const Courses = () => {
  const [userId, setUserId] = useState('');
  const [userCourses, setUserCourses] = useState([]);

  const fetchUserCourses = async () => {
    if (!userId) return;
    const { data } = await api.get(`/courses/user/${userId}`);
    setUserCourses(data);
  };

  const toggleLock = async (userCourseId) => {
    await api.patch(`/courses/${userCourseId}/toggle`);
    fetchUserCourses();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Manage User Courses</h2>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Enter user ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="p-3 border rounded-lg flex-1"
        />
        <button onClick={fetchUserCourses} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
          Load
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        {userCourses.length === 0 ? (
          <p className="text-gray-500">No courses loaded.</p>
        ) : (
          userCourses.map((uc) => (
            <div key={uc.id} className="flex justify-between items-center p-3 border-b dark:border-gray-700">
              <span>{uc.courses.name} ({uc.courses.departments.name})</span>
              <button
                onClick={() => toggleLock(uc.id)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  uc.is_locked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {uc.is_locked ? 'Locked' : 'Unlocked'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Courses;