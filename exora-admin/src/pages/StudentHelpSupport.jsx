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
} from "lucide-react";
import api from "../api/axios";

const StudentHelpSupport = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({
    subject: "",
    category: "technical",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

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
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/student/support-tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/student/support-tickets", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Ticket submitted successfully! We will respond within 24 hours.");
      setShowTicketForm(false);
      setFormData({ subject: "", category: "technical", message: "" });
      fetchTickets();
    } catch (error) {
        console.log(error)
      alert("Error submitting ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <Clock size={14} className="text-yellow-600" />;
      case "in-progress":
        return <AlertCircle size={14} className="text-blue-600" />;
      case "resolved":
        return <CheckCircle size={14} className="text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "resolved":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Help & Support
        </h1>
        <p className="text-gray-500 mt-1">
          Get assistance with your account and exams
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Contact & Quick Actions */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
              <div className="flex items-center gap-2">
                <Headphones size={20} className="text-white" />
                <h2 className="text-lg font-semibold text-white">Contact Us</h2>
              </div>
              <p className="text-indigo-100 text-xs mt-1">
                We're here to help 24/7
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition group">
                <Mail
                  size={18}
                  className="text-indigo-600 group-hover:scale-110 transition"
                />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">
                    support@exora.com
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition group">
                <Phone
                  size={18}
                  className="text-indigo-600 group-hover:scale-110 transition"
                />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-800">
                    +251-911-123456
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition group">
                <MessageCircle
                  size={18}
                  className="text-indigo-600 group-hover:scale-110 transition"
                />
                <div>
                  <p className="text-xs text-gray-500">Telegram</p>
                  <p className="text-sm font-medium text-gray-800">
                    @ExoraSupportBot
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Quick Actions
            </h2>
            <button
              onClick={() => setShowTicketForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition mb-3"
            >
              <Ticket size={16} />
              Open Support Ticket
            </button>
            <button
              onClick={() => window.open("https://t.me/ExoraSupportBot")}
              className="w-full flex items-center justify-center gap-2 border border-indigo-600 text-indigo-600 py-2.5 rounded-xl font-medium hover:bg-indigo-50 transition"
            >
              <MessageCircle size={16} />
              Chat on Telegram
            </button>
          </div>

          {/* Support Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Support Hours
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monday - Friday</span>
                <span className="text-gray-800 font-medium">
                  8:00 AM - 8:00 PM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saturday</span>
                <span className="text-gray-800 font-medium">
                  9:00 AM - 5:00 PM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sunday</span>
                <span className="text-gray-800 font-medium">Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - FAQ & Tickets */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Frequently Asked Questions
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Quick answers to common questions
              </p>
            </div>
            <div className="p-4 space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-gray-100 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-800 hover:bg-gray-50 transition"
                  >
                    <span className="text-sm">{faq.q}</span>
                    {activeFaq === idx ? (
                      <ChevronUp size={18} className="text-indigo-600" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </button>
                  {activeFaq === idx && (
                    <div className="p-4 pt-0 text-gray-600 text-sm border-t border-gray-100 bg-gray-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* My Tickets Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  My Support Tickets
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Track your support requests
              </p>
            </div>
            <div className="p-5">
              {tickets.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Ticket size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No tickets yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Open a support ticket if you need help
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`border rounded-xl p-4 ${getStatusColor(ticket.status)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {ticket.subject}
                        </h3>
                        <span
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}
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
                          {new Date(ticket.createdAt).toLocaleDateString()}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">
                Open Support Ticket
              </h3>
              <p className="text-indigo-100 text-sm mt-0.5">
                Describe your issue and we'll help you
              </p>
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                >
                  <option value="technical">🔧 Technical Issue</option>
                  <option value="payment">💰 Payment Problem</option>
                  <option value="exam">📝 Exam Issue</option>
                  <option value="other">❓ Other</option>
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="flex-1 border border-gray-300 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
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
