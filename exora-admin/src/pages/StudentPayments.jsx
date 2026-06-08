import { useState, useEffect } from "react";
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle, CreditCard, X, FileText, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const StudentPayments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [payments, setPayments] = useState([]);

  // Payment info from backend
  const [paymentInfo, setPaymentInfo] = useState({
    amount: "...",
    originalAmount: "",
    discount: null,
    bank: "...",
    accountNumber: "...",
    accountName: "...",
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
    setLoadingInfo(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/student/payment-info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentInfo(data);
    } catch (err) {
      console.error("Failed to fetch payment info:", err);
    } finally {
      setLoadingInfo(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/student/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(data || []);
    } catch (err) {
      setError("Unable to load payment info");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("receipt", receiptFile);
    // NO paymentId needed

    try {
      const token = localStorage.getItem("token");
      await api.post("/student/payments/upload-receipt", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccessMessage("Receipt uploaded! Admin will verify soon.");
      setTimeout(() => setSuccessMessage(""), 5000);
      setShowUploadModal(false);
      setReceiptFile(null);
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      verified: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle size={12} />, label: "Verified" },
      approved: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle size={12} />, label: "Verified" },
      pending: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", icon: <Clock size={12} />, label: "Pending" },
      declined: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", icon: <AlertCircle size={12} />, label: "Declined" },
    };
    return badges[status] || { bg: "bg-gray-50", text: "text-gray-700", icon: null, label: status || "Unknown" };
  };

  const hasDiscount = paymentInfo.discount && paymentInfo.discount !== "0%" && paymentInfo.discount !== "";

  if (loading || loadingInfo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" /> Back
      </button>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-600" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Payment Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm relative overflow-hidden">
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-0 right-0">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-1.5 rounded-bl-xl shadow-lg flex items-center gap-1.5">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-xs font-bold">{paymentInfo.discount} OFF</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Details</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">One payment unlocks all departments</p>
          </div>
        </div>

        {/* Price with Discount */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-5">
          <div className="flex items-end justify-center gap-3">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{paymentInfo.amount}</span>
            {hasDiscount && (
              <span className="text-xl text-gray-400 dark:text-gray-500 line-through mb-1">{paymentInfo.originalAmount}</span>
            )}
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            {hasDiscount ? "Limited time offer • One-time payment" : "One-time payment • Access all departments"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Bank</span>
            <span className="font-medium text-gray-900 dark:text-white">{paymentInfo.bank}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Account Number</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white select-all">{paymentInfo.accountNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Account Name</span>
            <span className="font-medium text-gray-900 dark:text-white">{paymentInfo.accountName}</span>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full mt-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          <Upload size={16} /> Upload Receipt
        </button>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment History</h3>
          <div className="space-y-3">
            {payments.slice(0, 10).map((p, i) => {
              const badge = getStatusBadge(p.status);
              return (
                <div key={p.id || i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Payment #{i + 1}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.amount ? `${p.amount} ETB` : "Receipt uploaded"} • {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
            <div className="bg-gray-800 px-5 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Upload Receipt</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setReceiptFile(null);
                }}
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 text-xs text-amber-700 dark:text-amber-400">
                <CreditCard size={12} className="inline mr-1" /> Transfer {paymentInfo.amount} to {paymentInfo.bank}: {paymentInfo.accountNumber} ({paymentInfo.accountName})
              </div>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${receiptFile
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                  }`}
              >
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
                      <p className="text-sm text-gray-600 dark:text-gray-300">Click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (max 5MB)</p>
                    </>
                  )}
                </label>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setReceiptFile(null);
                  }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadReceipt}
                  disabled={!receiptFile || uploading}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-1">
                      <Loader2 size={14} className="animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    "Submit"
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