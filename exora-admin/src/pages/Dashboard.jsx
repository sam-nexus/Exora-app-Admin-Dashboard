import { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { Users, BookOpen, FileQuestion, Clock, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, courses: 0, questions: 0, pendingPayments: 0 });
  const [usersOverTime, setUsersOverTime] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, usersTimeRes, recentRes] = await Promise.all([
        api.get('/stats'),
        api.get('/stats/users-over-time'),
        api.get('/stats/recent-activity'),
      ]);
      setStats(statsRes.data);
      setUsersOverTime(usersTimeRes.data);
      setRecentActivity(recentRes.data);
    };
    fetchData();
  }, []);

  // Pie data for departments (just count of departments? but we don't have a count, we can use stats.courses? actually we want departments count, we'll add it from stats. Our /stats returns courses count but not departments. We'll just show courses count as a pie for now. We'll modify backend to return department count later, but for now use courses.
  const pieData = [
    { name: 'Courses', value: stats.courses },
    { name: 'Users', value: stats.users },
  ];
  const COLORS = ['#6366f1', '#a78bfa'];

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold text-gray-800">Dashboard</motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users />} title="Total Users" value={stats.users} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<BookOpen />} title="Total Courses" value={stats.courses} color="bg-green-100 text-green-600" />
        <StatCard icon={<FileQuestion />} title="Total Questions" value={stats.questions} color="bg-purple-100 text-purple-600" />
        <StatCard icon={<Clock />} title="Pending Payments" value={stats.pendingPayments} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Over Time Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Users Registered (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={usersOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#e0e7ff" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Departments / Courses Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-gray-600 font-medium">User</th>
                <th className="p-3 text-gray-600 font-medium">Email</th>
                <th className="p-3 text-gray-600 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((user) => (
                <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{user.full_name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
export default Dashboard;