import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Trash2, Eye, Edit, Plus, Search, Lock } from 'lucide-react';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [lockAllConfirm, setLockAllConfirm] = useState(false);

  const fetchUsers = async () => {
    const { data } = await api.get('/users');
    setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const totalUsers = users.length;
  const newToday = users.filter(u => {
    const today = new Date().toISOString().split('T')[0];
    return new Date(u.created_at).toISOString().split('T')[0] === today;
  }).length;

  const handleDelete = async (id) => {
    await api.delete(`/users/${id}`);
    setDeleteConfirm(false);
    fetchUsers();
  };

  const handleUpdate = async (updatedUser) => {
    await api.put(`/users/${updatedUser.id}`, {
      full_name: updatedUser.full_name,
      email: updatedUser.email,
    });
    setEditModal(false);
    fetchUsers();
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      password: formData.get('password'),
    };
    try {
      await api.post('/users', payload);
      setAddModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  // Lock all courses for a specific user
  const handleLockUserCourses = async (userId) => {
    try {
      await api.post(`/courses/lock-all/${userId}`);
      alert(`All courses locked for user ${userId}`);
      fetchUsers(); // optional refresh
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to lock courses');
    }
  };

  // Lock all courses for all users
  const handleLockAllUsersCourses = async () => {
    try {
      await api.post('/courses/lock-all-users');
      setLockAllConfirm(false);
      alert('All courses locked for all users');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to lock all courses');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u => u.full_name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term));
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Users</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLockAllConfirm(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Lock size={20} /> Lock All Courses
          </button>
          <button onClick={() => setAddModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={20} /> Add User
          </button>
        </div>
      </motion.div>

      {/* Count cards (unchanged) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">New Today</p>
          <p className="text-2xl font-bold text-gray-800">{newToday}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="text-2xl font-bold text-gray-800">{0}</p>
        </div>
      </div>

      {/* Search and filter bar (unchanged) */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select className="border border-gray-200 rounded-lg px-4 py-2" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Table (add lock button per user) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-gray-600 font-medium">Name</th>
                <th className="p-4 text-left text-gray-600 font-medium">Email</th>
                <th className="p-4 text-left text-gray-600 font-medium">Joined</th>
                <th className="p-4 text-center text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-4">{user.full_name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setSelectedUser(user); setViewModal(true); }} className="text-blue-600 hover:text-blue-800"><Eye size={20} /></button>
                      <button onClick={() => { setSelectedUser(user); setEditModal(true); }} className="text-green-600 hover:text-green-800"><Edit size={20} /></button>
                      <button onClick={() => handleLockUserCourses(user.id)} className="text-orange-600 hover:text-orange-800" title="Lock all courses for this user"><Lock size={20} /></button>
                      <button onClick={() => { setSelectedUser(user); setDeleteConfirm(true); }} className="text-red-600 hover:text-red-800"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals (same as before: View, Edit, Delete, Add) */}
      {viewModal && (
        <Modal onClose={() => setViewModal(false)}>
          <h3 className="text-xl font-semibold mb-4">User Details</h3>
          <div className="space-y-2">
            <p><strong>Name:</strong> {selectedUser.full_name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>ID:</strong> {selectedUser.id}</p>
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal onClose={() => setEditModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Edit User</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target;
            handleUpdate({
              id: selectedUser.id,
              full_name: form.full_name.value,
              email: form.email.value,
            });
          }}>
            <input name="full_name" defaultValue={selectedUser.full_name} className="w-full p-2 border rounded mb-2" />
            <input name="email" defaultValue={selectedUser.email} className="w-full p-2 border rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(false)}>
          <h3 className="text-xl font-semibold mb-4">Delete User</h3>
          <p>Are you sure you want to delete <strong>{selectedUser.full_name}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button onClick={() => handleDelete(selectedUser.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}

      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-semibold mb-4">Add New User</h3>
          <form onSubmit={handleAddUser}>
            <input name="fullName" placeholder="Full Name" className="w-full p-2 border rounded mb-2" required />
            <input name="email" type="email" placeholder="Email" className="w-full p-2 border rounded mb-2" required />
            <input name="password" type="password" placeholder="Password" className="w-full p-2 border rounded mb-4" required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create User</button>
            </div>
          </form>
        </Modal>
      )}

      {lockAllConfirm && (
        <Modal onClose={() => setLockAllConfirm(false)}>
          <h3 className="text-xl font-semibold mb-4">Lock All Courses</h3>
          <p>Are you sure you want to lock <strong>all</strong> courses for <strong>all</strong> users?</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setLockAllConfirm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button onClick={handleLockAllUsersCourses} className="px-4 py-2 bg-orange-600 text-white rounded-lg">Lock All</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;