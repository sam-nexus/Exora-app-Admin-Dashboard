import { useState, useEffect } from 'react';
import api from '../api/axios';
import { CheckCircle, XCircle, Clock, Loader2, MessageSquare, Eye, Send } from 'lucide-react';
import Modal from '../components/Modal';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'closed'
  const [replyModal, setReplyModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  // Counts
  const [counts, setCounts] = useState({ total: 0, open: 0, closed: 0 });

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/support/all?status=${filter}`);
      setTickets(data || []);

      // Fetch all for counts
      const allRes = await api.get('/support/all?status=all');
      const all = allRes.data || [];
      setCounts({
        total: all.length,
        open: all.filter(t => t.status === 'open').length,
        closed: all.filter(t => t.status === 'closed').length,
      });
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/support/${id}/status`, { status: newStatus });
      fetchTickets();
      setMessage(`Ticket marked as ${newStatus}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to update status.');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/${selectedTicket.id}/reply`, { reply: replyText });
      setReplyModal(false);
      setReplyText('');
      fetchTickets();
      setMessage('✅ Reply sent and ticket closed.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (status) => {
    if (status === 'open') return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800"><Clock size={12} /> Open</span>;
    if (status === 'closed') return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"><CheckCircle size={12} /> Closed</span>;
    return status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Support Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user support requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"><MessageSquare size={24} /></div>
          <div><p className="text-sm text-gray-500">Total Tickets</p><p className="text-2xl font-bold text-gray-800">{counts.total}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-orange-100 text-orange-600"><Clock size={24} /></div>
          <div><p className="text-sm text-gray-500">Open</p><p className="text-2xl font-bold text-gray-800">{counts.open}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-100 text-green-600"><CheckCircle size={24} /></div>
          <div><p className="text-sm text-gray-500">Closed</p><p className="text-2xl font-bold text-gray-800">{counts.closed}</p></div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {['all', 'open', 'closed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Tickets Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <MessageSquare size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tickets found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-gray-600 font-medium text-sm">User</th>
                  <th className="p-4 text-left text-gray-600 font-medium text-sm">Subject</th>
                  <th className="p-4 text-left text-gray-600 font-medium text-sm">Date</th>
                  <th className="p-4 text-left text-gray-600 font-medium text-sm">Status</th>
                  <th className="p-4 text-center text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="font-medium text-sm">{ticket.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{ticket.profiles?.email || ''}</p>
                    </td>
                    <td className="p-4 text-sm font-medium">{ticket.subject}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td className="p-4">{statusBadge(ticket.status)}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setSelectedTicket(ticket); setViewModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="View Details">
                          <Eye size={16} />
                        </button>
                        {ticket.status === 'open' && (
                          <>
                            <button onClick={() => handleStatusChange(ticket.id, 'closed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Close Ticket">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => { setSelectedTicket(ticket); setReplyModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Reply & Close">
                              <Send size={16} />
                            </button>
                          </>
                        )}
                        {ticket.status === 'closed' && (
                          <button onClick={() => handleStatusChange(ticket.id, 'open')} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Reopen Ticket">
                            <Clock size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {viewModal && selectedTicket && (
        <Modal onClose={() => setViewModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h3>
          <p className="text-sm text-gray-500 mb-4">From: {selectedTicket.profiles?.full_name} ({selectedTicket.profiles?.email})</p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-700">{selectedTicket.message}</p>
          </div>
          {selectedTicket.admin_reply && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-1">Admin Reply:</p>
              <p className="text-sm text-green-700">{selectedTicket.admin_reply}</p>
            </div>
          )}
          <div className="mt-4 flex justify-between text-xs text-gray-400">
            <span>Status: {selectedTicket.status}</span>
            <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
          </div>
        </Modal>
      )}

      {/* Reply Modal */}
      {replyModal && selectedTicket && (
        <Modal onClose={() => setReplyModal(false)}>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Reply to Ticket</h3>
          <p className="text-sm text-gray-500 mb-4">Subject: {selectedTicket.subject}</p>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setReplyModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
              className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${sending ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Send Reply & Close</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Support;