import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import {
  Trash2,
  Eye,
  Edit,
  Search,
  Lock,
  Unlock,
  Loader2,
  Users as UsersIcon,
  UserPlus,
  GraduationCap,
  BookOpen,
  CheckCircle,
  Shield,
  Key,
  Zap,
  TrendingUp,
  FileQuestion,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import Modal from "../components/Modal";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [accessModal, setAccessModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterLock, setFilterLock] = useState("all"); // "all" | "locked" | "unlocked"
  const [lockAllConfirm, setLockAllConfirm] = useState(false);
  const [userLockStatus, setUserLockStatus] = useState({});
  const [toggling, setToggling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc, date_asc, name_asc, name_desc

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data);

      // Fetch real lock status — true = all locked, false = at least one unlocked
      const statusMap = {};
      await Promise.all(
        data.map(async (u) => {
          if (u.role !== 'user') return;
          try {
            const res = await api.get(`/courses/user/${u.id}`);
            const userCourses = res.data || [];
            // In fetchUsers, change the lock status logic:
            const allLocked = userCourses.length === 0 ||
              userCourses
                .filter((uc) => !uc.courses?.is_free) // only check paid courses
                .every((uc) => uc.is_locked);
            statusMap[u.id] = allLocked;
          } catch {
            statusMap[u.id] = true;
          }
        })
      );
      setUserLockStatus(statusMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsAndCourses = async () => {
    try {
      const [deptRes, courseRes] = await Promise.all([
        api.get("/departments"),
        api.get("/courses"),
      ]);
      setDepartments(deptRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      console.error("Failed to fetch departments and courses", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartmentsAndCourses();
  }, []);

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const studentCount = users.filter((u) => u.role === "user").length;
  const newToday = users.filter((u) => {
    const today = new Date().toISOString().split("T")[0];
    return new Date(u.created_at).toISOString().split("T")[0] === today;
  }).length;

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await api.delete(`/users/${id}`);
      setDeleteConfirm(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (updatedUser) => {
    setActionLoading(true);
    try {
      await api.put(`/users/${updatedUser.id}`, {
        full_name: updatedUser.full_name,
        email: updatedUser.email,
      });
      setEditModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    };
    setActionLoading(true);
    try {
      await api.post("/users", payload);
      setAddModal(false);
      e.target.reset();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (userId) => {
    if (toggling === userId) return;
    setToggling(userId);
    try {
      await api.post(`/courses/toggle-all/${userId}`);
      setUserLockStatus((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }));
    } catch (err) {
      alert(err.response?.data?.error || "Toggle failed");
    } finally {
      setToggling(null);
    }
  };

  const handleLockAllUsersCourses = async () => {
    try {
      await api.post("/courses/lock-all-users");
      setLockAllConfirm(false);
      const allLocked = {};
      users.forEach((u) => {
        allLocked[u.id] = true;
      });
      setUserLockStatus(allLocked);
      alert("All courses locked for all users");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to lock all courses");
    }
  };

  // Filter and Sort Users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term),
      );
    }

    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    // Filter by lock status (only applies to students)
    if (filterLock === "locked") {
      filtered = filtered.filter((u) => u.role !== "admin" && userLockStatus[u.id] === true);
    } else if (filterLock === "unlocked") {
      filtered = filtered.filter((u) => u.role !== "admin" && userLockStatus[u.id] === false);
    }

    // Sort
    if (sortBy === "date_desc") {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "date_asc") {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "name_asc") {
      filtered.sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || ""),
      );
    } else if (sortBy === "name_desc") {
      filtered.sort((a, b) =>
        (b.full_name || "").localeCompare(a.full_name || ""),
      );
    }

    return filtered;
  }, [users, searchTerm, filterRole, filterLock, userLockStatus, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-indigo-600 mx-auto mb-3"
          />
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Users
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and monitor all platform users
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setLockAllConfirm(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition shadow-sm"
          >
            <Lock size={18} /> Lock All Courses
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition"
          >
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm border border-indigo-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-indigo-900">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-200 rounded-xl flex items-center justify-center">
              <UsersIcon size={24} className="text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Admins</p>
              <p className="text-3xl font-bold text-purple-900">{adminCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Students</p>
              <p className="text-3xl font-bold text-green-900">
                {studentCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
              <GraduationCap size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">New Today</p>
              <p className="text-3xl font-bold text-orange-900">{newToday}</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <select
          className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">Student</option>
        </select>

        {/* Lock Status Filter */}
        <select
          className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
          value={filterLock}
          onChange={(e) => setFilterLock(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="locked">🔒 Locked</option>
          <option value="unlocked">🔓 Unlocked</option>
        </select>

        {/* Sort Dropdown */}
        <div className="relative">
          <ArrowUpDown
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date_desc">📅 Latest First</option>
            <option value="date_asc">📅 Oldest First</option>
            <option value="name_asc">📝 Name (A-Z)</option>
            <option value="name_desc">📝 Name (Z-A)</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition">
                  <div className="flex items-center gap-1">
                    Joined
                    {sortBy === "date_desc" && (
                      <TrendingUp size={12} className="text-indigo-500" />
                    )}
                    {sortBy === "date_asc" && (
                      <TrendingUp
                        size={12}
                        className="text-indigo-500 rotate-180"
                      />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {user.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-gray-900">
                          {user.full_name || "No Name"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                          }`}
                      >
                        {user.role === "admin" ? "👨‍💼 Admin" : "👨‍🎓 Student"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setViewModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setEditModal(true);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        {user.role === "user" && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setAccessModal(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Manage Access"
                          >
                            <Key size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleLock(user.id)}
                          disabled={toggling === user.id}
                          className={`p-1.5 rounded-lg transition ${userLockStatus[user.id]
                              ? "text-red-600 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                            } disabled:opacity-50`}
                          title={
                            userLockStatus[user.id]
                              ? "Courses Locked — click to Unlock"
                              : "Courses Unlocked — click to Lock"
                          }
                        >
                          {toggling === user.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : userLockStatus[user.id] ? (
                            <Lock size={18} />
                          ) : (
                            <Unlock size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setDeleteConfirm(true);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results Summary */}
        {filteredAndSortedUsers.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            Showing {filteredAndSortedUsers.length} of {users.length} users
          </div>
        )}
      </div>

      {/* Rest of the modals remain the same... */}
      {/* View Modal */}
      {viewModal && selectedUser && (
        <Modal onClose={() => setViewModal(false)}>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {selectedUser.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {selectedUser.full_name}
            </h3>
            <p className="text-gray-500 text-sm">
              {selectedUser.role || "Student"}
            </p>
          </div>
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="text-gray-900 font-medium">
                {selectedUser.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">User ID:</span>
              <span className="text-gray-900 font-medium text-sm">
                {selectedUser.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Joined:</span>
              <span className="text-gray-900">
                {new Date(selectedUser.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${userLockStatus[selectedUser.id] ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}
              >
                {userLockStatus[selectedUser.id]
                  ? "All Courses Locked"
                  : "Courses Unlocked"}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && selectedUser && (
        <Modal onClose={() => setEditModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Edit User</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate({
                id: selectedUser.id,
                full_name: e.target.full_name.value,
                email: e.target.email.value,
              });
            }}
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                name="full_name"
                defaultValue={selectedUser.full_name}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                defaultValue={selectedUser.email}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
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
                )}{" "}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && selectedUser && (
        <Modal onClose={() => setDeleteConfirm(false)}>
          <div className="text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Delete User
            </h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete{" "}
              <strong className="text-gray-900">
                {selectedUser.full_name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedUser.id)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2"
              >
                {actionLoading && (
                  <Loader2 size={16} className="animate-spin" />
                )}{" "}
                Delete User
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add User Modal */}
      {addModal && (
        <Modal onClose={() => setAddModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Add New User</h3>
          <form onSubmit={handleAddUser}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                name="fullName"
                placeholder="Enter full name"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="Enter email"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="Enter password"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="user">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
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
                )}{" "}
                Create User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Access Modal */}
      {accessModal && selectedUser && (
        <Modal onClose={() => setAccessModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key size={24} className="text-indigo-600" />
            Manage {selectedUser.full_name}'s Access
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <Zap size={16} className="inline mr-2" />
                Grant access to all departments and course types (Regular, Mock,
                Exit)
              </p>
            </div>
            {departments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No departments available
              </p>
            ) : (
              departments.map((dept) => {
                const deptCourses = courses.filter(
                  (c) => c.department_id === dept.id,
                );
                const regularCourses = deptCourses.filter(
                  (c) => c.type === "regular",
                );
                const mockCourses = deptCourses.filter(
                  (c) => c.type === "mock",
                );
                const exitCourses = deptCourses.filter(
                  (c) => c.type === "exit",
                );
                return (
                  <div
                    key={dept.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{dept.icon || "📚"}</span>
                      <h4 className="font-semibold text-gray-900">
                        {dept.name}
                      </h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">
                        <BookOpen size={14} /> Regular ({regularCourses.length})
                      </div>
                      <div className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg">
                        <FileQuestion size={14} /> Mock ({mockCourses.length})
                      </div>
                      <div className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                        <GraduationCap size={14} /> Exit ({exitCourses.length})
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-800 font-medium">
                <CheckCircle size={16} className="inline mr-2" />✅ Student can
                now access all department materials and course types
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => setAccessModal(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              onClick={async () => {
                try {
                  await api.post(`/courses/toggle-all/${selectedUser.id}`);
                  setUserLockStatus((prev) => ({ ...prev, [selectedUser.id]: false }));
                  setAccessModal(false);
                  alert(`All courses unlocked for ${selectedUser.full_name}`);
                } catch (err) {
                  alert(err.response?.data?.error || "Failed to grant access");
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition"
            >
              Grant Full Access
            </button>
          </div>
        </Modal>
      )}

      {/* Lock All Users Modal */}
      {lockAllConfirm && (
        <Modal onClose={() => setLockAllConfirm(false)}>
          <div className="text-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Lock All Courses
            </h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to lock <strong>all courses</strong> for{" "}
              <strong>all users</strong>? This will prevent all students from
              accessing their courses.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setLockAllConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLockAllUsersCourses}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition"
              >
                Lock All
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;
