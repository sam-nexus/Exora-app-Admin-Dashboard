import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Trash2, Edit, Plus, Search, Loader2, AlertCircle, Zap } from 'lucide-react';
import Modal from '../components/Modal';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Departments fetch error:', err);
      if (err.response) {
        setError(`Server error: ${err.response.data?.error || err.response.status}`);
      } else if (err.request) {
        setError('Network error. Check if backend is running and accessible.');
      } else {
        setError(err.message || 'Failed to fetch departments');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  // Add single department
  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const icon = form.icon.value.trim();

    if (!name) {
      setError('Department name is required');
      return;
    }

    setError('');
    setActionLoading(true);
    try {
      await api.post('/departments', { name, icon: icon || null });
      setAddModal(false);
      form.reset();
      setSuccess('Department added successfully');
      setTimeout(() => setSuccess(''), 3000);
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add department');
    } finally {
      setActionLoading(false);
    }
  };

  // Add complete department structure (main + model + exit)
  const handleAddComplete = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const icon = form.icon.value.trim();

    if (!name) {
      setError('Department name is required');
      return;
    }

    setError('');
    setActionLoading(true);
    try {
      const { data } = await api.post('/department-structure/complete-department', {
        name,
        icon: icon || '📁',
      });
      setCompleteModal(false);
      form.reset();
      setSuccess(`✅ Created "${name}" with Model Exams and Exit Exams departments!`);
      setTimeout(() => setSuccess(''), 4000);
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create department structure');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const icon = form.icon.value.trim();

    if (!name) {
      setError('Department name is required');
      return;
    }

    setError('');
    setActionLoading(true);
    try {
      await api.put(`/departments/${selectedDept.id}`, { name, icon: icon || null });
      setEditModal(false);
      setSelectedDept(null);
      setSuccess('Department updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update department');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/departments/${selectedDept.id}`);
      setDeleteConfirm(false);
      setSelectedDept(null);
      setSuccess('Department deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete department');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter: hide model/exit departments from main list, show separately
  const mainDepts = departments.filter(
    (d) => !d.name.includes(' - Model Exams') && !d.name.includes(' - Exit Exams')
  );

  const filtered = mainDepts.filter((d) =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeptVariants = (deptName) => {
    return {
      model: departments.find((d) => d.name === `${deptName} - Model Exams`),
      exit: departments.find((d) => d.name === `${deptName} - Exit Exams`),
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Departments</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setError('');
              setCompleteModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
            Complete Department
          </button>
          <button
            onClick={() => {
              setError('');
              setAddModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            Add Department
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 flex items-center gap-2">
          ✅ {success}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
              No departments found.
            </div>
          ) : (
            filtered.map((dept) => {
              const variants = getDeptVariants(dept.name);
              return (
                <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Main Department Row */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{dept.icon || '📁'}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                        <p className="text-xs text-gray-500">Main Department</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDept(dept);
                          setError('');
                          setEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-800 p-2"
                        title="Edit"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDept(dept);
                          setError('');
                          setDeleteConfirm(true);
                        }}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Variants Row */}
                  {(variants.model || variants.exit) && (
                    <div className="bg-gray-50 px-4 py-3 flex gap-4 text-sm">
                      {variants.model && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📝</span>
                          <span className="text-gray-700">
                            <strong>Model:</strong> {variants.model.name}
                          </span>
                        </div>
                      )}
                      {variants.exit && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏆</span>
                          <span className="text-gray-700">
                            <strong>Exit:</strong> {variants.exit.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Complete Department Modal */}
      {completeModal && (
        <Modal onClose={() => setCompleteModal(false)}>
          <h3 className="text-xl font-semibold mb-2">Add Complete Department</h3>
          <p className="text-sm text-gray-600 mb-4">
            This will automatically create three departments:
            <br />
            • Main courses
            <br />• Model Exams
            <br />• Exit Exams
          </p>
          <form onSubmit={handleAddComplete}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
            <input
              name="name"
              placeholder="e.g. Computer Science"
              className="w-full p-2 border rounded mb-3"
              required
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input
              name="icon"
              placeholder="e.g. 💻"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompleteModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1"
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />} Create Structure
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Single Department Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Add Department</h3>
          <form onSubmit={handleAdd}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              name="name"
              placeholder="e.g. Computer Science"
              className="w-full p-2 border rounded mb-3"
              required
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input
              name="icon"
              placeholder="e.g. 💻"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1"
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />} Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Department Modal */}
      {editModal && selectedDept && (
        <Modal onClose={() => { setEditModal(false); setSelectedDept(null); }}>
          <h3 className="text-xl font-semibold mb-4">Edit Department</h3>
          <form onSubmit={handleEdit}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              name="name"
              defaultValue={selectedDept.name}
              className="w-full p-2 border rounded mb-3"
              required
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input
              name="icon"
              defaultValue={selectedDept.icon || ''}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1"
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />} Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && selectedDept && (
        <Modal onClose={() => { setDeleteConfirm(false); setSelectedDept(null); }}>
          <h3 className="text-xl font-semibold mb-4">Delete Department</h3>
          <p>
            Are you sure you want to delete <strong>{selectedDept.name}</strong>?
            <br />
            <span className="text-sm text-gray-600 mt-2 block">
              Note: This will only delete this department, not its variants (Model/Exit).
            </span>
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setDeleteConfirm(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1"
            >
              {actionLoading && <Loader2 size={16} className="animate-spin" />} Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Departments;
