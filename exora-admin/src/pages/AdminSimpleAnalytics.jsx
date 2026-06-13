import { useState, useEffect } from 'react';
import { Loader2, Users, Eye, TrendingUp, Globe, Monitor, Smartphone } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const AdminSimpleAnalytics = () => {
  const [data, setData] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitorsLoading, setVisitorsLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/stats')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    api.get('/analytics/recent-visitors')
      .then(res => setVisitors(res.data))
      .catch(console.error)
      .finally(() => setVisitorsLoading(false));
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Prepare chart data
  const chartData = data?.dailyStats?.map(d => ({
    date: d.date?.slice(5), // MM-DD format
    views: d.count,
  })) || [];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={36} className="animate-spin text-indigo-600 mx-auto" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Website Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track user engagement and traffic</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-indigo-100 rounded-xl shrink-0">
            <Eye size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data.todayViews}</p>
            <p className="text-sm text-gray-500">Views Today</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-purple-100 rounded-xl shrink-0">
            <Users size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data.uniqueVisitors}</p>
            <p className="text-sm text-gray-500">Unique Visitors Today</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-emerald-100 rounded-xl shrink-0">
            <TrendingUp size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data.totalViews}</p>
            <p className="text-sm text-gray-500">Total All-Time Views</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-orange-100 rounded-xl shrink-0">
            <Globe size={24} className="text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data.dailyStats?.length || 0}</p>
            <p className="text-sm text-gray-500">Days Tracked</p>
          </div>
        </div>
      </div>

      {/* Daily Views Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Daily Views (Last 7 Days)</h2>
            <p className="text-sm text-gray-500 mt-0.5">Page views over time</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-3 h-3 bg-indigo-500 rounded-full inline-block" />
            Page Views
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                }}
                labelStyle={{ fontWeight: 600, color: '#374151' }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                fill="url(#colorViews)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <TrendingUp size={40} className="mb-3 opacity-50" />
            <p className="text-sm">No data yet — chart will appear once users visit</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-1 gap-6">

        {/* Recent Visitors Table — Full Width */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Recent Visitors</h2>
              <p className="text-sm text-gray-500 mt-0.5">Latest user activity on the platform</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Users size={14} />
              <span>{visitors.length} visitors</span>
            </div>
          </div>

          {visitorsLoading ? (
            <div className="flex justify-center py-14">
              <Loader2 size={28} className="animate-spin text-indigo-500" />
            </div>
          ) : visitors.length > 0 ? (
            <div className="overflow-auto max-h-[500px] rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Page</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Device</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">IP Address</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Visited At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visitors.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                            {v.user?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-gray-800 font-medium text-sm leading-tight">{v.user}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-md" title={v.page}>
                          {v.page}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          {v.device?.includes('Mobile') ? (
                            <Smartphone size={13} className="text-indigo-500" />
                          ) : (
                            <Monitor size={13} className="text-purple-500" />
                          )}
                          {v.device}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs text-gray-400 font-mono">{v.ip || '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-600 font-medium">
                            {new Date(v.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(v.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users size={48} className="mb-4 opacity-40" />
              <p className="text-sm font-medium">No visitors yet</p>
              <p className="text-xs mt-1">Visitor data will appear here once users browse the site</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminSimpleAnalytics;