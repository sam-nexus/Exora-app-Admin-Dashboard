import { useState, useEffect } from "react";
import {
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Headphones,
  Ticket,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const StudentHelpSupport = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({
    subject: "",
    category: "technical",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg: string }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const faqs = [
    {
      q: "How do I unlock a department?",
      a: "Go to Payments page, select the department you want to unlock, make payment via TeleBirr or upload receipt, and admin will verify within 24 hours.",
    },
    {
      q: "My mock exam froze during submission, what should I do?",
      a: "Open a support ticket with the course name and time of issue. Our team will restore your attempt or provide a retake.",
    },
    {
      q: "How can I get my exit exam certificate?",
      a: "After passing the exit exam with 50% or above, you can download your certificate from the exit exam results page.",
    },
    {
      q: "Can I retake a mock exam?",
      a: "Yes, you can retake each mock exam up to 3 times. Your best score will be saved.",
    },
    {
      q: "I forgot my password, how to reset?",
      a: "Click Forgot Password on the login page and follow the instructions sent to your email.",
    },
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data } = await api.get("/student/support-tickets");
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/student/support-tickets", formData);
      showToast("success", "Ticket submitted! We'll respond within 24 hours.");
      setShowTicketForm(false);
      setFormData({ subject: "", category: "technical", message: "" });
      fetchTickets();
    } catch (error) {
      showToast("error", error?.response?.data?.error || "Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <Clock size={12} className="text-amber-600" />;
      case "in-progress":
        return <AlertCircle size={12} className="text-blue-600" />;
      case "resolved":
        return <CheckCircle size={12} className="text-emerald-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm animate-slideIn
          ${toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'}`}>
          {toast.type === 'success'
            ? <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            : <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
          <p className="text-sm font-medium flex-1">{toast.msg}</p>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      )}
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Help & Support</h1>
            <p className="text-sm text-gray-500 mt-0.5">Get assistance with your account and exams</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Contact & Quick Actions */}
        <div className="space-y-6">
          {/* Contact Card */}
         

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <button
              onClick={() => setShowTicketForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-lg font-medium hover:bg-gray-900 transition mb-3"
            >
              <Ticket size={15} />
              Open Support 
            </button>
            
          </div>

          {/* Support Hours */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Support Hours</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monday - Friday</span>
                <span className="text-gray-800">8:00 AM - 8:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saturday</span>
                <span className="text-gray-800">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sunday</span>
                <span className="text-gray-800">Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - FAQ & Tickets */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAQ Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900">Frequently Asked Questions</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Quick answers to common questions</p>
            </div>
            <div className="p-4 space-y-2">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex justify-between items-center p-3 text-left font-medium text-gray-800 hover:bg-gray-50 transition"
                  >
                    <span className="text-sm">{faq.q}</span>
                    {activeFaq === idx ? (
                      <ChevronUp size={16} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </button>
                  {activeFaq === idx && (
                    <div className="p-3 pt-0 text-gray-600 text-sm border-t border-gray-100 bg-gray-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* My Tickets Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Ticket size={16} className="text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900">My Support Tickets</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Track your support requests</p>
            </div>
            <div className="p-5">
              {loadingTickets ? (
                <div className="text-center py-10">
                  <Loader2 size={24} className="animate-spin text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Loading tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Ticket size={22} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No tickets yet</p>
                  <p className="text-sm text-gray-400 mt-1">Open a support ticket if you need help</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`border rounded-lg p-3 ${getStatusColor(ticket.status)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {ticket.subject}
                        </h3>
                        <span
                          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}
                        >
                          {getStatusIcon(ticket.status)}
                          {ticket.status === "open"
                            ? "Open"
                            : ticket.status === "in-progress"
                              ? "In Progress"
                              : "Resolved"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {ticket.message}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Ticket #{ticket.id}</span>
                        <span>
                          {new Date(ticket.createdAt || ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Form Modal */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden">
            <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Open Support Ticket</h3>
                <p className="text-gray-300 text-sm mt-0.5">Describe your issue and we'll help you</p>
              </div>
              <button
                onClick={() => setShowTicketForm(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitTicket} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Brief description of your issue"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition"
                >
                  <option value="technical">Technical Issue</option>
                  <option value="payment">Payment Problem</option>
                  <option value="exam">Exam Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Please provide detailed information about your issue..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition resize-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHelpSupport;