import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Trash2, Edit, Plus, Search, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

const Courses = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptCourses, setDeptCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Counts
  const [totalCourses, setTotalCourses] = useState(0);

  const fetchDepartments = async () => {
    const { data } = await api.get('/departments');
    setDepartments(data);
  };

  const fetchAllCourses = async () => {
    const { data } = await api.get('/courses');
    setCourses(data);
    setTotalCourses(data.length);
  };

  useEffect(() => {
    fetchDepartments();
    fetchAllCourses();
  }, []);

  const handleViewDept = async (dept) => {
    setSelectedDept(dept);
    const { data } = await api.get(`/courses?department_id=${dept.id}`);
    setDeptCourses(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    await api.post('/courses', {
      department_id: selectedDept.id,
      name: form.name.value,
    });
    setAddModal(false);
    handleViewDept(selectedDept); // refresh
    fetchAllCourses(); // update global list
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const form = e.target;
    await api.put(`/courses/${selectedCourse.id}`, { name: form.name.value });
    setEditModal(false);
    handleViewDept(selectedDept);
    fetchAllCourses();
  };

  const handleDelete = async () => {
    await api.delete(`/courses/${selectedCourse.id}`);
    setDeleteConfirm(false);
    handleViewDept(selectedDept);
    fetchAllCourses();
  };

  const filteredDepts = useMemo(() => {
    if (!filterDept) return departments;
    return departments.filter(d => d.name.toLowerCase().includes(filterDept.toLowerCase()));
  }, [departments, filterDept]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-800">Courses Management</h2>
      </motion.div>

      {/* Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Departments</p>
          <p className="text-2xl font-bold text-gray-800">{departments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Courses</p>
          <p className="text-2xl font-bold text-gray-800">{totalCourses}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Active Courses</p>
          <p className="text-2xl font-bold text-gray-800">{totalCourses}</p>
        </div>
      </div>

      {/* Search / Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepts.map((dept) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-colors ${selectedDept?.id === dept.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100 hover:border-indigo-200'}`}
          >
            <div className="text-4xl mb-3">{dept.icon || '📁'}</div>
            <h3 className="text-lg font-semibold text-gray-800">{dept.name}</h3>
            <button
              onClick={() => handleViewDept(dept)}
              className="mt-4 flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 text-sm"
            >
              <Eye size={16} /> View Courses
            </button>
          </motion.div>
        ))}
      </div>

      {/* Expanded Department Courses */}
      {selectedDept && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{selectedDept.name} Courses</h3>
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Plus size={16} /> Add Course
            </button>
          </div>
          {deptCourses.length === 0 ? (
            <p className="text-gray-500">No courses yet.</p>
          ) : (
            <div className="space-y-3">
              {deptCourses.map((course) => (
                <div key={course.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <span className="font-medium">{course.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedCourse(course); setEditModal(true); }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => { setSelectedCourse(course); setDeleteConfirm(true); }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Add Course Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Add Course</h3>
          <form onSubmit={handleAdd}>
            <input name="name" placeholder="Course name" className="w-full p-2 border rounded mb-4" required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Course Modal */}
      {editModal && selectedCourse && (
        <Modal onClose={() => setEditModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Edit Course</h3>
          <form onSubmit={handleEdit}>
            <input name="name" defaultValue={selectedCourse.name} className="w-full p-2 border rounded mb-4" required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && selectedCourse && (
        <Modal onClose={() => setDeleteConfirm(false)}>
          <h3 className="text-xl font-semibold mb-4">Delete Course</h3>
          <p>Are you sure you want to delete <strong>{selectedCourse.name}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Courses;