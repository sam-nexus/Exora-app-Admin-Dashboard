import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  CheckCircle, XCircle, Clock, Eye, Loader2, RefreshCw,
  User, Calendar, Building2, Globe, ShieldCheck,
} from 'lucide-react';

const Payments = () => {
  const [receipts, setReceipts]       = useState([]);
  const [allReceipts, setAllReceipts] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filter, setFilter]           = useState('pending');
  const [actionId, setActionId]       = useState(null);
  // confirmModal: { id, action: 'approve'|'decline', name, departmentName, hasDept }
  const [confirmModal, setConfirmModal] = useState(null);

  const counts = {
    pending:  allReceipts.filter(r => r.status === 'pending').length,
    approved: allReceipts.filter(r => r.status === 'approved').length,
    declined: allReceipts.filter(r => r.status === 'declined').length,
  };

  const fetchReceipts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/payments?status=all');
      setAllReceipts(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReceipts(); }, []);

  useEffect(() => {
    setReceipts(filter === 'all' ? allReceipts : allReceipts.filter(r => r.status === filter));
  }, [filter, allReceipts]);

  // scope: 'department' | 'all'
  const handleApprove = async (id, scope) => {
    setActionId(id);
    try {
      await api.patch(`/payments/${id}/approve`, { scope });
      setAllReceipts(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    } catch (err) {
      alert(err.response?.data?.error || 'Approval failed');
    } finally {
      setActionId(null);
      setConfirmModal(null);
    }
  };

  const handleDecline = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/payments/${id}/decline`);
      setAllReceipts(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' } : r));
    } catch (err) {
      alert(err.response?.data?.error || 'Decline failed');
    } finally {
      setActionId(null);
      setConfirmModal(null);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'pending':  return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"><Clock size={11} /> Pending</span>;
      case 'approved': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"><CheckCircle size={11} /> Approved</span>;
      case 'declined': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800"><XCircle size={11} /> Declined</span>;
      default: return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Payment Receipts</h2>
          <p className="text-sm text-gray-500 mt-1">Review and manage student payment submissions</p>
        </div>
        <button onClick={fetchReceipts} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending',  count: counts.pending,  icon: Clock,       bg: 'bg-yellow-50', border: 'border-yellow-200', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', textColor: 'text-yellow-800', f: 'pending' },
          { label: 'Approved', count: counts.approved, icon: CheckCircle, bg: 'bg-green-50',  border: 'border-green-200',  iconBg: 'bg-green-100',  iconColor: 'text-green-600',  textColor: 'text-green-800',  f: 'approved' },
          { label: 'Declined', count: counts.declined, icon: XCircle,     bg: 'bg-red-50',    border: 'border-red-200',    iconBg: 'bg-red-100',    iconColor: 'text-red-600',    textColor: 'text-red-800',    f: 'declined' },
        ].map(({ label, count, icon: Icon, bg, border, iconBg, iconColor, textColor, f }) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`${bg} border ${border} p-4 rounded-xl flex items-center gap-4 text-left transition hover:shadow-md ${filter === f ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}>
            <div className={`p-3 rounded-full ${iconBg}`}><Icon size={22} className={iconColor} /></div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'declined'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {f === 'all' ? allReceipts.length : allReceipts.filter(r => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchReceipts} className="text-sm underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Clock size={32} />
                        <p className="font-medium">No {filter !== 'all' ? filter : ''} receipts found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  receipts.map((r) => {
                    // department name from join (if column exists) or fallback
                    const deptName = r.departments?.name || r.department_name || null;
                    const hasDept  = !!r.department_id;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User size={14} className="text-indigo-600" />
                            </div>
                            <span className="font-medium text-gray-900">{r.profiles?.full_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-sm">{r.profiles?.email || '—'}</td>
                        <td className="px-5 py-4">
                          {deptName ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                              <Building2 size={11} /> {deptName}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400" />
                            {formatDate(r.created_at)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {r.image_url ? (
                            <a href={r.image_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                              <Eye size={15} /> View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No file</span>
                          )}
                        </td>
                        <td className="px-5 py-4">{statusBadge(r.status)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-1.5">
                            {r.status === 'pending' ? (
                              <>
                                {/* Approve — department scope (only if dept is known) */}
                                {hasDept && (
                                  <button
                                    onClick={() => setConfirmModal({
                                      id: r.id, action: 'approve', scope: 'department',
                                      name: r.profiles?.full_name || 'this student',
                                      departmentName: deptName,
                                      hasDept,
                                    })}
                                    disabled={actionId === r.id}
                                    title={`Approve for ${deptName} only`}
                                    className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg hover:bg-emerald-200 text-xs font-semibold transition disabled:opacity-50">
                                    {actionId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Building2 size={12} />}
                                    Dept
                                  </button>
                                )}
                                {/* Approve — all access */}
                                <button
                                  onClick={() => setConfirmModal({
                                    id: r.id, action: 'approve', scope: 'all',
                                    name: r.profiles?.full_name || 'this student',
                                    departmentName: deptName,
                                    hasDept,
                                  })}
                                  disabled={actionId === r.id}
                                  title="Approve — unlock all courses"
                                  className="flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 text-xs font-semibold transition disabled:opacity-50">
                                  {actionId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                                  All
                                </button>
                                {/* Decline */}
                                <button
                                  onClick={() => setConfirmModal({
                                    id: r.id, action: 'decline',
                                    name: r.profiles?.full_name || 'this student',
                                  })}
                                  disabled={actionId === r.id}
                                  className="flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-200 text-xs font-semibold transition disabled:opacity-50">
                                  {actionId === r.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                  Decline
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                {r.status === 'approved' ? '✅ Unlocked' : '❌ Declined'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {receipts.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              Showing {receipts.length} of {allReceipts.length} receipts
            </div>
          )}
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">

            {/* Decline modal */}
            {confirmModal.action === 'decline' && (
              <>
                <div className="text-center">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={26} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Decline Payment?</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    {confirmModal.name} will be notified to resubmit their receipt.
                  </p>
                  <p className="text-xs text-gray-400 mb-5">This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmModal(null)}
                      className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDecline(confirmModal.id)}
                      disabled={actionId === confirmModal.id}
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                      {actionId === confirmModal.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Yes, Decline'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Approve modal — two scoped options */}
            {confirmModal.action === 'approve' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Approve Payment</h3>
                    <p className="text-sm text-gray-500">{confirmModal.name}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Choose how much access to grant:
                </p>

                <div className="space-y-3 mb-5">
                  {/* Option A — Department only */}
                  {confirmModal.hasDept ? (
                    <button
                      onClick={() => handleApprove(confirmModal.id, 'department')}
                      disabled={actionId === confirmModal.id}
                      className="w-full flex items-start gap-3 p-4 border-2 border-emerald-300 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition text-left disabled:opacity-50 group">
                      <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={17} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-800 text-sm">Department Access</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Unlock only <span className="font-semibold">{confirmModal.departmentName}</span> courses (regular + mock + exit)
                        </p>
                      </div>
                      {actionId === confirmModal.id && <Loader2 size={15} className="animate-spin text-emerald-600 ml-auto mt-1" />}
                    </button>
                  ) : (
                    <div className="w-full flex items-start gap-3 p-4 border-2 border-gray-200 bg-gray-50 rounded-xl text-left opacity-50 cursor-not-allowed">
                      <div className="w-9 h-9 bg-gray-300 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={17} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-500 text-sm">Department Access</p>
                        <p className="text-xs text-gray-400 mt-0.5">No department attached to this receipt</p>
                      </div>
                    </div>
                  )}

                  {/* Option B — All access */}
                  <button
                    onClick={() => handleApprove(confirmModal.id, 'all')}
                    disabled={actionId === confirmModal.id}
                    className="w-full flex items-start gap-3 p-4 border-2 border-indigo-300 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition text-left disabled:opacity-50">
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Globe size={17} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-indigo-800 text-sm">Full Access</p>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        Unlock <span className="font-semibold">all courses</span> across every department
                      </p>
                    </div>
                    {actionId === confirmModal.id && <Loader2 size={15} className="animate-spin text-indigo-600 ml-auto mt-1" />}
                  </button>
                </div>

                <button onClick={() => setConfirmModal(null)}
                  className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
