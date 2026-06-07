import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import {
  Trash2,
  Edit,
  Plus,
  Search,
  Eye,
  Loader2,
  BookOpen,
  Layers,
  GraduationCap,
  ChevronRight,
  X,
} from "lucide-react";
import Modal from "../components/Modal";

const Courses = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptCourses, setDeptCourses] = useState([]);
  const [filterDept, setFilterDept] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get("/departments");
      setDepartments(data);
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  const fetchAllCourses = async () => {
    try {
      const { data } = await api.get("/courses");
      setTotalCourses(data.length);
    } catch (err) {
      console.error("Fetch courses error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchAllCourses();
  }, []);

  const handleViewDept = async (dept) => {
    setSelectedDept(dept);
    setLoading(true);
    try {
      const { data } = await api.get(`/courses?department_id=${dept.id}`);
      setDeptCourses(data);
    } catch (err) {
      console.error("Fetch department courses error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const type = e.target.type.value || "regular";
    if (!name) return;

    setActionLoading(true);
    try {
      await api.post("/courses", {
        department_id: selectedDept.id,
        name,
        type,
      });
      setAddModal(false);
      e.target.reset();
      handleViewDept(selectedDept);
      fetchAllCourses();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add course");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const type = e.target.type.value || "regular";
    if (!name) return;

    setActionLoading(true);
    try {
      await api.put(`/courses/${selectedCourse.id}`, { name, type });
      setEditModal(false);
      setSelectedCourse(null);
      handleViewDept(selectedDept);
      fetchAllCourses();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update course");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/courses/${selectedCourse.id}`);
      setDeleteConfirm(false);
      setSelectedCourse(null);
      handleViewDept(selectedDept);
      fetchAllCourses();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete course");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDepts = useMemo(() => {
    if (!filterDept) return departments;
    return departments.filter((d) =>
      d.name.toLowerCase().includes(filterDept.toLowerCase()),
    );
  }, [departments, filterDept]);

  const getTypeBadge = (type) => {
    if (type === "mock") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
          📝 Mock Exam
        </span>
      );
    } else if (type === "exit") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          🎓 Exit Exam
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
        📚 Regular
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Courses Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Create and manage courses with multiple types (Regular, Mock, Exit)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Departments</p>
              <p className="text-3xl font-bold text-indigo-600">
                {departments.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <p className="text-3xl font-bold text-purple-600">
                {totalCourses}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Layers size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Departments</p>
              <p className="text-3xl font-bold text-green-600">
                {departments.filter((d) => d.is_active !== false).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <GraduationCap size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search departments..."
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDepts.map((dept) => (
          <div
            key={dept.id}
            className={`group bg-white rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${selectedDept?.id === dept.id
              ? "border-indigo-500 ring-2 ring-indigo-200"
              : "border-gray-100 hover:border-indigo-200"
              }`}
            onClick={() => handleViewDept(dept)}
          >
            <div className="p-5">
              <div className="text-4xl mb-3">{dept.icon || "📚"}</div>
              <h3 className="text-lg font-semibold text-gray-800">
                {dept.name}
              </h3>
              <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
                <Eye size={14} className="mr-1" />
                View Courses
                <ChevronRight size={14} className="ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Department Section */}
      {selectedDept && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedDept.name}
                </h3>
                <p className="text-indigo-100 text-sm">
                  Manage courses for this department
                </p>
              </div>
              <button
                onClick={() => setAddModal(true)}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition text-sm font-medium"
              >
                <Plus size={16} /> Add Course
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
              </div>
            ) : deptCourses.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No courses yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Click "Add Course" to create your first course
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deptCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition bg-white"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-gray-800">
                          {course.name}
                        </p>
                        {getTypeBadge(course.type)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {course.id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setEditModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Edit Course"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setDeleteConfirm(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Add New Course</h3>
            <p className="text-sm text-gray-500 mt-1">
              Create a course for {selectedDept?.name}
            </p>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name *
              </label>
              <input
                name="name"
                placeholder="e.g., Data Structures"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Type
              </label>
              <select
                name="type"
                defaultValue="regular"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="regular">📚 Regular Course</option>
                <option value="mock">📝 Mock Exam</option>
                <option value="exit">🎓 Exit Exam</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                id="is_free"
              />
              <label htmlFor="is_free" className="text-sm">Free Course (unlocked for all new users)</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setAddModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {actionLoading ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Course Modal */}
      {editModal && selectedCourse && (
        <Modal onClose={() => setEditModal(false)}>
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit size={24} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Edit Course</h3>
            <p className="text-sm text-gray-500 mt-1">
              Update course information
            </p>
          </div>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name *
              </label>
              <input
                name="name"
                defaultValue={selectedCourse.name}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Type
              </label>
              <select
                name="type"
                defaultValue={selectedCourse.type || "regular"}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="regular">📚 Regular Course</option>
                <option value="mock">📝 Mock Exam</option>
                <option value="exit">🎓 Exit Exam</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                id="is_free"
              />
              <label htmlFor="is_free" className="text-sm">Free Course (unlocked for all new users)</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && selectedCourse && (
        <Modal
          onClose={() => {
            setDeleteConfirm(false);
            setSelectedCourse(null);
          }}
        >
          <div className="text-center mb-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Delete Course</h3>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone
            </p>
          </div>
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete{" "}
            <strong className="text-red-600">{selectedCourse.name}</strong>?
            <br />
            <span className="text-xs text-gray-400">
              All questions in this course will also be deleted.
            </span>
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading && <Loader2 size={16} className="animate-spin" />}
              {actionLoading ? "Deleting..." : "Delete Course"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Courses;
