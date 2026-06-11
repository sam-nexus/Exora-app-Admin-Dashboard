import { useState, useEffect } from 'react';
import { Loader2, Users, Eye, TrendingUp, Globe, User, Monitor, Smartphone, Clock } from 'lucide-react';
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
      <h1 className="text-3xl font-bold text-gray-800">Website Analytics</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl"><Eye size={24} className="text-indigo-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data.todayViews}</p>
            <p className="text-sm text-gray-500">Views Today</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl"><Users size={24} className="text-purple-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data.uniqueVisitors}</p>
            <p className="text-sm text-gray-500">Unique Visitors Today</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl"><TrendingUp size={24} className="text-emerald-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data.totalViews}</p>
            <p className="text-sm text-gray-500">Total All-Time Views</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl"><Globe size={24} className="text-orange-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{data.dailyStats?.length || 0}</p>
            <p className="text-sm text-gray-500">Days Tracked</p>
          </div>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Views (Last 7 Days)</h2>
        {data.dailyStats?.length > 0 ? (
          <div className="flex items-end gap-2 h-40">
            {data.dailyStats.map((d, i) => {
              const maxCount = Math.max(...data.dailyStats.map(x => x.count));
              const height = maxCount > 0 ? Math.max((d.count / maxCount) * 100, 4) : 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-600">{d.count}</span>
                  <div
                    className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{d.date?.slice(5)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Pages</h2>
          {data.topPages?.length > 0 ? (
            <div className="space-y-2">
              {data.topPages.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">{p.page}</span>
                  </div>
                  <span className="text-sm font-semibold">{p.count} views</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          )}
        </div>

        {/* Recent Visitors Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Visitors</h2>
          {visitorsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : visitors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-xs font-medium text-gray-500">User</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500">Page</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500">Device</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((v, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                            {v.user?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="truncate max-w-[100px]" title={v.user}>{v.user}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        <span className="text-gray-600 truncate max-w-[120px] block" title={v.page}>{v.page}</span>
                      </td>
                      <td className="py-2 pr-2">
                        <span className="text-xs text-gray-500">{v.device}</span>
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(v.time)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No visitors yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSimpleAnalytics;