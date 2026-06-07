import { useState, useEffect, useMemo } from 'react';
import { Upload, CheckCircle, Clock, AlertCircle, CreditCard, Wallet, Lock, Unlock, Download, Eye, X, Search, Filter, ChevronDown } from 'lucide-react';
import api from '../api/axios';

const StudentPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [lockedDepartments, setLockedDepartments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  
  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc = latest first

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
      // Sort by date (latest first)
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
    // When coming from Unlock tab: selectedPayment.id = department id
    // When coming from History tab (re-upload): selectedPayment.department_id = department id
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
      alert('Receipt uploaded successfully! Admin will verify it soon.');
      setShowUploadModal(false);
      setReceiptFile(null);
      fetchPayments();
      fetchLockedDepartments();
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.response?.data?.error || 'Error uploading receipt.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <CheckCircle size={12} /> Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
            <Clock size={12} /> Pending
          </span>
        );
      case 'declined':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            <AlertCircle size={12} /> Declined
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{status}</span>;
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  };

  // Filter and Search Logic
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    
    // Search by department name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.departmentName || p.department || '').toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Filter by date range
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
    
    // Sort
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Payments
        </h1>
        <p className="text-gray-500 mt-1">Manage your payments and unlock departments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-800">{totalSpent} Birr</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Verified Payments</p>
              <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Locked Depts</p>
              <p className="text-2xl font-bold text-red-600">{lockedDepartments.length}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Lock size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-t-lg font-medium text-sm transition ${
            activeTab === 'history'
              ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-200'
              : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          Payment History
        </button>
        <button
          onClick={() => setActiveTab('unlock')}
          className={`px-5 py-2.5 rounded-t-lg font-medium text-sm transition ${
            activeTab === 'unlock'
              ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-200'
              : 'text-gray-500 hover:text-indigo-600'
          }`}
        >
          Unlock Departments
        </button>
      </div>

      {/* Unlock Departments Tab */}
      {activeTab === 'unlock' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={20} className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Available Departments</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">Purchase access to departments you want to study</p>
          
          {lockedDepartments.length === 0 ? (
            <div className="text-center py-10">
              <Unlock size={40} className="text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">All departments unlocked!</p>
              <p className="text-sm text-gray-400 mt-1">You have access to all departments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lockedDepartments.map((dept) => (
                <div key={dept.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{dept.courseCount} Courses</p>
                    </div>
                    <span className="text-lg font-bold text-indigo-600">{dept.price || 50} Birr</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPayment({ id: dept.id, departmentName: dept.name });
                      setShowUploadModal(true);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition"
                  >
                    <Unlock size={16} />
                    Unlock Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Search and Filter Bar */}
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by department name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              {/* Status Filter */}
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="declined">Declined</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Date Filter */}
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Sort By */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-12 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="date_desc">Latest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="amount_desc">Highest Amount</option>
                  <option value="amount_asc">Lowest Amount</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-gray-500">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="hover:text-indigo-900">×</button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="hover:text-indigo-900">×</button>
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                    Date: {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                    <button onClick={() => setDateFilter('all')} className="hover:text-indigo-900">×</button>
                  </span>
                )}
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter('all'); setSortBy('date_desc'); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 border-b border-red-100 text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard size={32} className="text-gray-300" />
                        <p>No payment records found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(payment.date || payment.created_at)}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{payment.departmentName || payment.department || 'Department'}</td>
                      <td className="px-6 py-4 text-gray-600">{payment.amount ?? '—'} Birr</td>
                      <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                      <td className="px-6 py-4">
                        {payment.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowUploadModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            <Upload size={14} />
                            Upload Receipt
                          </button>
                        ) : payment.status === 'verified' || payment.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 text-green-600 text-sm">
                            <CheckCircle size={14} />
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Contact Support</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Results Summary */}
          {filteredPayments.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
          )}
        </div>
      )}

      {/* Upload Receipt Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Upload Payment Receipt</h3>
                <p className="text-indigo-100 text-sm mt-0.5">Submit your payment proof</p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setReceiptFile(null);
                }}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 rounded-xl p-4 mb-5">
                <p className="text-sm text-yellow-800">
                  <strong>Department:</strong> {selectedPayment?.departmentName || selectedPayment?.name || 'Selected Department'}
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  <strong>Amount:</strong> {selectedPayment?.amount || 500} Birr
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt File</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-500 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer block">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 5MB)</p>
                </label>
              </div>

              {receiptFile && (
                <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} />
                  Selected: {receiptFile.name}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setReceiptFile(null);
                  }}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadReceipt}
                  disabled={!receiptFile || uploading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </span>
                  ) : (
                    'Upload Receipt'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPayments;