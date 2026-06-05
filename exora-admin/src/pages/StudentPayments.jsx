import { useState, useEffect, useMemo } from 'react';
import { 
  Upload, CheckCircle, Clock, AlertCircle, CreditCard, Wallet, 
  Lock, Unlock, X, Search, Filter, ChevronDown,
  TrendingUp, Calendar, Tag, Shield, Sparkles,
  ArrowUpRight, Info, DollarSign, Receipt, FileText, Loader2
} from 'lucide-react';
import api from '../api/axios';

const StudentPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [lockedDepartments, setLockedDepartments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedBank, setSelectedBank] = useState('cbe');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchPayments();
    fetchLockedDepartments();
  }, []);

  const fetchPayments = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.get('/student/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedData = (data || []).sort((a, b) => 
        new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
      );
      setPayments(sortedData);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.response?.data?.error || 'Unable to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLockedDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.get('/student/locked-departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLockedDepartments(data || []);
    } catch (err) {
      console.error('Error fetching locked departments:', err);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !selectedPayment) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('receipt', receiptFile);
    const deptId = selectedPayment.department_id || selectedPayment.id;
    formData.append('paymentId', deptId);

    try {
      const token = localStorage.getItem('token');
      await api.post('/student/payments/upload-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setSuccessMessage('Receipt uploaded successfully! Admin will verify it soon.');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
      setShowUploadModal(false);
      setReceiptFile(null);
      setSelectedBank('cbe');
      fetchPayments();
      fetchLockedDepartments();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Error uploading receipt.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: <CheckCircle size={12} className="text-emerald-600" />,
          label: 'Verified'
        };
      case 'pending':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: <Clock size={12} className="text-amber-600" />,
          label: 'Pending'
        };
      case 'declined':
      case 'failed':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: <AlertCircle size={12} className="text-red-600" />,
          label: 'Declined'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: null,
          label: status
        };
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.departmentName || p.department || '').toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.created_at || p.date);
        if (dateFilter === 'today') return paymentDate >= today;
        if (dateFilter === 'week') return paymentDate >= weekAgo;
        if (dateFilter === 'month') return paymentDate >= monthAgo;
        return true;
      });
    }
    
    if (sortBy === 'date_desc') {
      filtered.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    } else if (sortBy === 'date_asc') {
      filtered.sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
    } else if (sortBy === 'amount_desc') {
      filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    } else if (sortBy === 'amount_asc') {
      filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));
    }
    
    return filtered;
  }, [payments, searchTerm, statusFilter, dateFilter, sortBy]);

  const totalSpent = payments
    .filter(p => p.status === 'verified' || p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const verifiedCount = payments.filter(p => p.status === 'verified' || p.status === 'approved').length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-gray-400 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 z-50 animate-slideInRight">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              <p className="text-emerald-700 text-sm">{successMessage}</p>
              <button onClick={() => setShowSuccessToast(false)} className="text-emerald-600 ml-2">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 right-4 z-50 animate-slideInRight">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={() => setError('')} className="text-red-600 ml-2">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage payments and unlock departments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<DollarSign size={16} />}
          value={`${totalSpent} Br`}
          label="Total Spent"
          sublabel="Lifetime"
          color="blue"
        />
        <StatCard
          icon={<CheckCircle size={16} />}
          value={verifiedCount}
          label="Verified"
          sublabel="Completed"
          color="green"
        />
        <StatCard
          icon={<Clock size={16} />}
          value={pendingCount}
          label="Pending"
          sublabel="Awaiting"
          color="orange"
        />
        <StatCard
          icon={<Lock size={16} />}
          value={lockedDepartments.length}
          label="Locked"
          sublabel="Departments"
          color="red"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-t-lg text-sm font-medium transition ${
              activeTab === 'history'
                ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Receipt size={14} />
              Payment History
            </span>
          </button>
          <button
            onClick={() => setActiveTab('unlock')}
            className={`px-5 py-2.5 rounded-t-lg text-sm font-medium transition ${
              activeTab === 'unlock'
                ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Unlock size={14} />
              Unlock Departments
            </span>
          </button>
        </div>
      </div>

      {/* Unlock Departments Tab */}
      {activeTab === 'unlock' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Wallet size={16} className="text-gray-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Available Departments</h2>
                <p className="text-xs text-gray-500">Purchase access to departments</p>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            {lockedDepartments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Unlock size={24} className="text-emerald-600" />
                </div>
                <p className="font-medium text-gray-800">All departments unlocked!</p>
                <p className="text-sm text-gray-500 mt-1">You have full access</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lockedDepartments.map((dept) => (
                  <DepartmentCard
                    key={dept.id}
                    department={dept}
                    onUnlock={() => {
                      setSelectedPayment({ id: dept.id, departmentName: dept.name, amount: dept.price || 500 });
                      setShowUploadModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Search and Filter Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none bg-white"
                />
              </div>
              
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="declined">Declined</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 appearance-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 appearance-none cursor-pointer"
                >
                  <option value="date_desc">Latest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="amount_desc">Highest Amount</option>
                  <option value="amount_asc">Lowest Amount</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Active Filters */}
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2">
                <span className="text-xs text-gray-500">Filters:</span>
                {searchTerm && (
                  <FilterChip label={`Search: ${searchTerm}`} onRemove={() => setSearchTerm('')} />
                )}
                {statusFilter !== 'all' && (
                  <FilterChip label={`Status: ${statusFilter}`} onRemove={() => setStatusFilter('all')} />
                )}
                {dateFilter !== 'all' && (
                  <FilterChip 
                    label={`Date: ${dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Last 7 Days' : 'Last 30 Days'}`} 
                    onRemove={() => setDateFilter('all')} 
                  />
                )}
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter('all'); setSortBy('date_desc'); }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Payment Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt size={32} className="text-gray-300" />
                        <p className="text-gray-500">No payment records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const status = getStatusBadge(payment.status);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-gray-600">{formatDate(payment.date || payment.created_at)}</td>
                        <td className="px-5 py-3 font-medium text-gray-900">{payment.departmentName || payment.department || 'Department'}</td>
                        <td className="px-5 py-3 font-semibold text-gray-800">{payment.amount ?? '—'} Br</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {payment.status === 'pending' ? (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowUploadModal(true);
                              }}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm"
                            >
                              <Upload size={13} />
                              Upload
                            </button>
                          ) : payment.status === 'verified' || payment.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                              <CheckCircle size={13} />
                              Unlocked
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Contact Support</span>
                          )}
                        </td>
                       </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Results Summary */}
          {filteredPayments.length > 0 && (
            <div className="px-5 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
          )}
        </div>
      )}

      {/* Upload Receipt Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gray-800 px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Upload Payment Receipt</h3>
                <p className="text-gray-300 text-sm">Submit payment proof for verification</p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setReceiptFile(null);
                  setSelectedBank('cbe');
                }}
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                <div className="flex items-start gap-2">
                  <Tag size={14} className="text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedPayment?.departmentName || selectedPayment?.name || 'Selected Department'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Amount: <span className="font-semibold">{selectedPayment?.amount || 500} Birr</span></p>
                  </div>
                </div>
              </div>

              {/* Bank Account Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                  <CreditCard size={12} /> Transfer Payment To
                </p>

                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-md text-sm focus:ring-1 focus:ring-amber-400 mb-2"
                >
                  <option value="cbe">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="awash">Awash Bank</option>
                  <option value="dashen">Dashen Bank</option>
                  <option value="telebirr">Telebirr</option>
                </select>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-amber-600">Account Number:</span>
                    <span className="font-mono font-medium">1000XXXXXX</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">Account Name:</span>
                    <span className="font-medium">Exora Educational Services</span>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt</label>
                <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition
                  ${receiptFile ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer block">
                    {receiptFile ? (
                      <>
                        <FileText size={28} className="mx-auto text-emerald-500 mb-1" />
                        <p className="text-sm text-emerald-600">{receiptFile.name}</p>
                      </>
                    ) : (
                      <>
                        <Upload size={28} className="mx-auto text-gray-400 mb-1" />
                        <p className="text-sm text-gray-600">Click to upload</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 5MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setReceiptFile(null);
                    setSelectedBank('cbe');
                  }}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadReceipt}
                  disabled={!receiptFile || uploading}
                  className="flex-1 bg-gray-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-1">
                      <Loader2 size={14} className="animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Submit Receipt'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, value, label, sublabel, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-1">
        <div className={`w-8 h-8 ${colors[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xl font-bold text-gray-800">{value}</span>
      </div>
      <p className="text-xs font-medium text-gray-700">{label}</p>
      <p className="text-[10px] text-gray-400">{sublabel}</p>
    </div>
  );
};

const DepartmentCard = ({ department, onUnlock }) => (
  <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
    <div className="flex items-start justify-between mb-2">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <Lock size={18} className="text-gray-600" />
      </div>
      <span className="text-lg font-bold text-gray-800">{department.price || 500} Br</span>
    </div>
    <h3 className="font-semibold text-gray-900">{department.name}</h3>
    <p className="text-xs text-gray-500 mt-0.5">{department.courseCount} Courses</p>
    <button
      onClick={onUnlock}
      className="mt-3 w-full flex items-center justify-center gap-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition"
    >
      <Unlock size={13} /> Unlock Now
    </button>
  </div>
);

const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
    {label}
    <button onClick={onRemove} className="hover:text-gray-900">×</button>
  </span>
);

export default StudentPayments;