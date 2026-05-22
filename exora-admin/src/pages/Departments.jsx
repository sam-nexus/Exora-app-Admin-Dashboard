import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Trash2, Edit, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Departments fetch error:', err);
      if (err.response) {
        // Server responded with an error status
        setError(`Server error: ${err.response.data?.error || err.response.status}`);
      } else if (err.request) {
        // No response received (network or CORS)
        setError('Network error. Check if backend is running and accessible.');
      } else {
        setError(err.message || 'Failed to fetch departments');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

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
    setLoading(true);
    try {
      await api.post('/departments', { name, icon: icon || null });
      setAddModal(false);
      form.reset();
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add department');
    } finally {
      setLoading(false);
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
    setLoading(true);
    try {
      await api.put(`/departments/${selectedDept.id}`, { name, icon: icon || null });
      setEditModal(false);
      setSelectedDept(null);
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update department');
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
      setError(err.response?.data?.error || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  const filtered = departments.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Departments</h2>
        <button
          onClick={() => {
            setError('');
            setAddModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          disabled={loading}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          Add Department
        </button>
      </motion.div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-gray-600 font-medium">Icon</th>
                <th className="p-4 text-left text-gray-600 font-medium">Name</th>
                <th className="p-4 text-center text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No departments found.
                  </td>
                </tr>
              ) : (
                filtered.map((dept) => (
                  <tr key={dept.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-2xl">{dept.icon || '📁'}</td>
                    <td className="p-4 font-medium">{dept.name}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => { setSelectedDept(dept); setError(''); setEditModal(true); }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => { setSelectedDept(dept); setError(''); setDeleteConfirm(true); }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Add Department</h3>
          <form onSubmit={handleAdd}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" placeholder="e.g. Computer Science" className="w-full p-2 border rounded mb-3" required />
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input name="icon" placeholder="e.g. 💻" className="w-full p-2 border rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1">
                {loading && <Loader2 size={16} className="animate-spin" />} Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && selectedDept && (
        <Modal onClose={() => { setEditModal(false); setSelectedDept(null); }}>
          <h3 className="text-xl font-semibold mb-4">Edit Department</h3>
          <form onSubmit={handleEdit}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" defaultValue={selectedDept.name} className="w-full p-2 border rounded mb-3" required />
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input name="icon" defaultValue={selectedDept.icon || ''} className="w-full p-2 border rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1">
                {loading && <Loader2 size={16} className="animate-spin" />} Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && selectedDept && (
        <Modal onClose={() => { setDeleteConfirm(false); setSelectedDept(null); }}>
          <h3 className="text-xl font-semibold mb-4">Delete Department</h3>
          <p>Are you sure you want to delete <strong>{selectedDept.name}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button onClick={handleDelete} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1">
              {loading && <Loader2 size={16} className="animate-spin" />} Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Departments;