import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Trash2,
  Edit,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Building2,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import Modal from "../components/Modal";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDepartments = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/departments");
      setDepartments(data);
    } catch (err) {
      console.error("Departments fetch error:", err);
      if (err.response) {
        setError(
          `Server error: ${err.response.data?.error || err.response.status}`,
        );
      } else if (err.request) {
        setError("Network error. Check if backend is running and accessible.");
      } else {
        setError(err.message || "Failed to fetch departments");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const icon = e.target.icon.value.trim();

    if (!name) {
      setError("Department name is required");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post("/departments", { name, icon: icon || null });
      setAddModal(false);
      e.target.reset();
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add department");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const icon = e.target.icon.value.trim();

    if (!name) {
      setError("Department name is required");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.put(`/departments/${selectedDept.id}`, {
        name,
        icon: icon || null,
      });
      setEditModal(false);
      setSelectedDept(null);
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update department");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/departments/${selectedDept.id}`);
      setDeleteConfirm(false);
      setSelectedDept(null);
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete department");
    } finally {
      setLoading(false);
    }
  };

  const filtered = departments.filter((d) =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Departments Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage academic departments and subjects
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setAddModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          Add Department
        </button>
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
              <Building2 size={24} className="text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <p className="text-3xl font-bold text-purple-600">—</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-3xl font-bold text-green-600">
                {departments.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <GraduationCap size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Departments Grid */}
      {loading && departments.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl">
              <Building2 size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No departments found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            filtered.map((dept) => (
              <div
                key={dept.id}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-5xl">{dept.icon || "📚"}</div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setSelectedDept(dept);
                        setError("");
                        setEditModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Edit Department"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDept(dept);
                        setError("");
                        setDeleteConfirm(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Department"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {dept.name}
                </h3>
                <p className="text-xs text-gray-400">ID: {dept.id}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <div className="mb-6 text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Add New Department
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Create a new academic department
            </p>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                name="name"
                placeholder="e.g., Computer Science"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon (emoji)
              </label>
              <input
                name="icon"
                placeholder="e.g., 💻"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Choose an emoji to represent this department
              </p>
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
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Adding..." : "Add Department"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && selectedDept && (
        <Modal onClose={() => setEditModal(false)}>
          <div className="mb-6 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit size={24} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Edit Department</h3>
            <p className="text-sm text-gray-500 mt-1">
              Update department information
            </p>
          </div>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                name="name"
                defaultValue={selectedDept.name}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon (emoji)
              </label>
              <input
                name="icon"
                defaultValue={selectedDept.icon || ""}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
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
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && selectedDept && (
        <Modal
          onClose={() => {
            setDeleteConfirm(false);
            setSelectedDept(null);
          }}
        >
          <div className="text-center mb-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Delete Department
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone
            </p>
          </div>
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete{" "}
            <strong className="text-red-600">{selectedDept.name}</strong>?
            <br />
            <span className="text-xs text-gray-400">
              All courses and questions in this department will also be deleted.
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Deleting..." : "Delete Department"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Departments;
