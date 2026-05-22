import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Trash2, Edit, Plus, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const fetchDepartments = async () => {
    const { data } = await api.get('/departments');
    setDepartments(data);
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    await api.post('/departments', { name: form.name.value, icon: form.icon.value });
    setAddModal(false);
    fetchDepartments();
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const form = e.target;
    await api.put(`/departments/${selectedDept.id}`, { name: form.name.value, icon: form.icon.value });
    setEditModal(false);
    fetchDepartments();
  };

  const handleDelete = async () => {
    await api.delete(`/departments/${selectedDept.id}`);
    setDeleteConfirm(false);
    fetchDepartments();
  };

  const filtered = departments.filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Departments</h2>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={20} /> Add Department
        </button>
      </motion.div>

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
            {filtered.map((dept) => (
              <tr key={dept.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="p-4 text-2xl">{dept.icon || '📁'}</td>
                <td className="p-4 font-medium">{dept.name}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => { setSelectedDept(dept); setEditModal(true); }} className="text-green-600 hover:text-green-800"><Edit size={20} /></button>
                  <button onClick={() => { setSelectedDept(dept); setDeleteConfirm(true); }} className="text-red-600 hover:text-red-800"><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Add Department</h3>
          <form onSubmit={handleAdd}>
            <input name="name" placeholder="Department name" className="w-full p-2 border rounded mb-2" required />
            <input name="icon" placeholder="Icon (emoji)" className="w-full p-2 border rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && selectedDept && (
        <Modal onClose={() => setEditModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Edit Department</h3>
          <form onSubmit={handleEdit}>
            <input name="name" defaultValue={selectedDept.name} className="w-full p-2 border rounded mb-2" required />
            <input name="icon" defaultValue={selectedDept.icon} className="w-full p-2 border rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && selectedDept && (
        <Modal onClose={() => setDeleteConfirm(false)}>
          <h3 className="text-xl font-semibold mb-4">Delete Department</h3>
          <p>Are you sure you want to delete <strong>{selectedDept.name}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default Departments;