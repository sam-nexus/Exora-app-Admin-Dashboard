import { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { Users, BookOpen, FileQuestion, Clock } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, courses: 0, questions: 0, pending: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const usersRes = await api.get('/users');
      const coursesRes = await api.get('/courses/all');   // you need to create this endpoint
      const questionsRes = await api.get('/questions/count');
      const pendingRes = await api.get('/payments/pending');
      setStats({
        users: usersRes.data.length,
        courses: coursesRes.data.length,
        questions: questionsRes.data.count,
        pending: pendingRes.data.length,
      });
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users />} title="Total Users" value={stats.users} />
        <StatCard icon={<BookOpen />} title="Total Courses" value={stats.courses} />
        <StatCard icon={<FileQuestion />} title="Total Questions" value={stats.questions} />
        <StatCard icon={<Clock />} title="Pending Payments" value={stats.pending} />
      </div>
    </div>
  );
};

export default Dashboard;