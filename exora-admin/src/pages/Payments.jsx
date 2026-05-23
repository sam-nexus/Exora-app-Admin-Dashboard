import { useState, useEffect } from 'react';
import api from '../api/axios';
import { DollarSign, CheckCircle, XCircle, Clock, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Payments = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'declined'

  // Count cards
  const [counts, setCounts] = useState({ pending: 0, approved: 0, declined: 0 });

  useEffect(() => {
    fetchReceipts();
  }, [filter]);

  const fetchReceipts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/payments?status=${filter}`);
      setReceipts(data);

      // Fetch all statuses for counts (could also have a dedicated stats endpoint)
      const allRes = await api.get('/payments?status=all');
      const all = allRes.data;
      setCounts({
        pending: all.filter(r => r.status === 'pending').length,
        approved: all.filter(r => r.status === 'approved').length,
        declined: all.filter(r => r.status === 'declined').length,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/payments/${id}/approve`);
      fetchReceipts();
    } catch (err) {
      alert(err.response?.data?.error || 'Approval failed');
    }
  };

  const handleDecline = async (id) => {
    try {
      await api.patch(`/payments/${id}/decline`);
      fetchReceipts();
    } catch (err) {
      alert(err.response?.data?.error || 'Decline failed');
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800"><Clock size={12} /> Pending</span>;
      case 'approved': return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"><CheckCircle size={12} /> Approved</span>;
      case 'declined': return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"><XCircle size={12} /> Declined</span>;
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-800">Payment Receipts</h2>
      </motion.div>

      {/* Count cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600"><Clock size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-800">{counts.pending}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-100 text-green-600"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-gray-800">{counts.approved}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-100 text-red-600"><XCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Declined</p>
            <p className="text-2xl font-bold text-gray-800">{counts.declined}</p>
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'declined'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>
      )}

      {/* Receipts table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-gray-600 font-medium">User</th>
                  <th className="p-4 text-left text-gray-600 font-medium">Email</th>
                  <th className="p-4 text-left text-gray-600 font-medium">Screenshot</th>
                  <th className="p-4 text-left text-gray-600 font-medium">Status</th>
                  <th className="p-4 text-center text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No receipts found.</td>
                  </tr>
                ) : (
                  receipts.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium">{r.profiles?.full_name}</td>
                      <td className="p-4">{r.profiles?.email}</td>
                      <td className="p-4">
                        <a
                          href={r.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <Eye size={16} /> View
                        </a>
                      </td>
                      <td className="p-4">{statusBadge(r.status)}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecline(r.id)}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 text-sm"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {r.status !== 'pending' && (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;