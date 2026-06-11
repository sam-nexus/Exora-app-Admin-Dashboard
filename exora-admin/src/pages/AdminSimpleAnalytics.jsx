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
      .then(res => setVisitors(res.data || []))
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Pages</h2>
          {data.topPages?.length > 0 ? (
            <div className="space-y-3">
              {data.topPages.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0 ? 'bg-indigo-600' : i === 1 ? 'bg-indigo-500' : i === 2 ? 'bg-indigo-400' : 'bg-gray-300'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[180px]" title={p.page}>{p.page}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{p.count}</span>
                    <span className="text-xs text-gray-400">views</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          )}
        </div>

        {/* Recent Visitors Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Visitors</h2>
          {visitorsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : visitors.length > 0 ? (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2.5 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="py-2.5 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                    <th className="py-2.5 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                    <th className="py-2.5 px-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((v, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {v.user?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="truncate max-w-[90px] text-gray-800 font-medium" title={v.user}>{v.user}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="text-gray-600 truncate max-w-[110px] block text-xs" title={v.page}>{v.page}</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          {v.device?.includes('Mobile') ? <Smartphone size={12} /> : <Monitor size={12} />}
                          {v.device}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(v.time)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users size={40} className="mb-3 opacity-50" />
              <p className="text-sm">No visitors yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSimpleAnalytics;