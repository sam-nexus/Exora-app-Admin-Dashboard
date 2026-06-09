import { useState, useEffect } from 'react';
import { Loader2, Users, Eye, Globe, Smartphone, TrendingUp, FileText } from 'lucide-react';
import api from '../api/axios';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/analytics/dashboard');
      setData(data);
      if (data.error) setError(data.error);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const maxViews = data?.dailyViews?.length > 0
    ? Math.max(...data.dailyViews.map(d => d.views))
    : 1;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Website Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track user engagement and traffic</p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ⚠️ {error} — Data may not be available yet. Analytics needs 24-48 hours to populate.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={22} />}
          value={data?.todayActive || '0'}
          label="Active Today"
          color="indigo"
        />
        <StatCard
          icon={<Eye size={22} />}
          value={data?.dailyViews?.reduce((sum, d) => sum + d.views, 0) || '0'}
          label="Views (7 Days)"
          color="purple"
        />
        <StatCard
          icon={<Smartphone size={22} />}
          value={data?.deviceStats?.[0]?.device || 'N/A'}
          label="Top Device"
          color="emerald"
        />
        <StatCard
          icon={<Globe size={22} />}
          value={data?.countryStats?.[0]?.country || 'N/A'}
          label="Top Country"
          color="orange"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Views Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Page Views (7 Days)</h2>
          </div>
          {data?.dailyViews?.length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {data.dailyViews.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">{d.views}</span>
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg hover:from-indigo-600 hover:to-indigo-500 transition-all cursor-pointer"
                    style={{ height: `${Math.max((d.views / maxViews) * 100, 4)}%` }}
                    title={`${d.date}: ${d.views} views`}
                  />
                  <span className="text-[10px] text-gray-400">{d.date?.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <TrendingUp size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Top Pages</h2>
          </div>
          {data?.topPages?.length > 0 ? (
            <div className="space-y-3">
              {data.topPages.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">{p.page}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{p.views} views</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <FileText size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>

        {/* Devices */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Smartphone size={16} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Devices</h2>
          </div>
          {data?.deviceStats?.length > 0 ? (
            <div className="space-y-3">
              {data.deviceStats.map((d, i) => {
                const total = data.deviceStats.reduce((s, x) => s + x.users, 0);
                const pct = total > 0 ? Math.round((d.users / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 capitalize">{d.device}</span>
                      <span className="font-semibold text-gray-800">{d.users} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Smartphone size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>

        {/* Countries */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Countries</h2>
          </div>
          {data?.countryStats?.length > 0 ? (
            <div className="space-y-3">
              {data.countryStats.map((c, i) => {
                const total = data.countryStats.reduce((s, x) => s + x.users, 0);
                const pct = total > 0 ? Math.round((c.users / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{c.country}</span>
                      <span className="font-semibold text-gray-800">{c.users} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Globe size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component
const StatCard = ({ icon, value, label, color }) => {
  const colors = {
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
};

export default Analytics;