import { useState, useEffect } from "react";
import {
  HelpCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Ticket,
  ArrowLeft,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const StudentHelpSupport = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({ subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/support/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const faqs = [
    {
      q: "How do I unlock all departments?",
      a: "Go to Payments, make a one-time payment of 50 ETB via CBE, upload your receipt, and admin will verify within 24 hours.",
    },
    {
      q: "Can I retake a mock exam?",
      a: "Yes, you can retake each mock exam up to 3 times. Your best score is saved.",
    },
    {
      q: "I forgot my password, how to reset?",
      a: "Click Forgot Password on the login page and follow the instructions.",
    },
    {
      q: "How can I get support?",
      a: "Open a support ticket using the form on this page or join our Telegram channel for quick help.",
    },
    {
      q: "How do I download course materials?",
      a: "Go to a department, select the Materials tab, and click Download on any available PDF.",
    },
  ];

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      showToast("error", "Subject and message are required.");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/support",
        { subject: formData.subject, message: formData.message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("success", "Ticket submitted! We'll respond within 24 hours.");
      setFormData({ subject: "", message: "" });
      fetchTickets();
    } catch (error) {
      showToast("error", error?.response?.data?.error || "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-400",
        icon: <Clock size={12} />,
        label: "Open",
      },
      "in-progress": {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-400",
        icon: <AlertCircle size={12} />,
        label: "In Progress",
      },
      resolved: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: <CheckCircle size={12} />,
        label: "Resolved",
      },
      closed: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: <CheckCircle size={12} />,
        label: "Closed",
      },
    };
    return (
      badges[status] || {
        bg: "bg-gray-50 dark:bg-gray-700",
        text: "text-gray-600 dark:text-gray-300",
        icon: null,
        label: status || "Unknown",
      }
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm animate-slideInRight ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate("/student")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" /> Back to Dashboard
      </button>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Get assistance with your account and exams
        </p>
      </div>

      {/* Two Column Layout: Form (Left) + FAQ (Right) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Submit Ticket Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Ticket size={16} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Submit a Request</h2>
            </div>
            <p className="text-indigo-200 text-xs mt-0.5">Describe your issue and we'll help you</p>
          </div>
          <form onSubmit={handleSubmitTicket} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                required
                placeholder="e.g., Payment issue, Course access problem..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition"
                required
                placeholder="Describe your issue in detail..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>

        {/* Right: FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <HelpCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-[460px] overflow-y-auto">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center p-3.5 text-left font-medium text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                >
                  <span className="pr-4">{faq.q}</span>
                  {activeFaq === idx ? (
                    <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>
                {activeFaq === idx && (
                  <div className="px-3.5 pb-3.5 pt-0 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-100 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Tickets Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <MessageCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Tickets</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track your support requests</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          {loadingTickets ? (
            <div className="text-center py-10">
              <Loader2 size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Ticket size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No tickets yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Submit a request using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const badge = getStatusBadge(ticket.status);
                return (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-sm transition-all duration-200 animate-fadeInUp"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {ticket.message}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-3 ${badge.bg} ${badge.text} border`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    {/* Admin Reply */}
                    {ticket.admin_reply && (
                      <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            Admin Reply
                          </p>
                        </div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-300">
                          {ticket.admin_reply}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Ticket #{ticket.id?.substring(0, 8)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(ticket.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHelpSupport;