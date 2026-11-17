import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  User,
  Check,
  X,
  Loader2,
  RefreshCw,
  Send,
  Building2,
  AlertTriangle
} from 'lucide-react';

export const WardenComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyModal, setReplyModal] = useState({ open: false, complaint: null });
  const [replyStatus, setReplyStatus] = useState('PROCESSING');
  const [replyRemarks, setReplyRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warden/complaints');
      if (res.data?.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const openReply = (complaint) => {
    setReplyModal({ open: true, complaint });
    setReplyStatus(complaint.status === 'OPEN' ? 'PROCESSING' : complaint.status);
    setReplyRemarks(complaint.wardenRemarks || '');
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!replyModal.complaint) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const res = await api.put(`/warden/complaints/${replyModal.complaint._id}`, {
        status: replyStatus,
        wardenRemarks: replyRemarks
      });

      if (res.data?.success) {
        setSuccess('Complaint updated & response sent to student.');
        setReplyModal({ open: false, complaint: null });
        fetchComplaints();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = complaints.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (item.studentName || item.studentId?.fullName || '').toLowerCase();
      const sRoll = (item.rollNumber || item.studentId?.universityRollNumber || '').toLowerCase();
      const room = (item.roomNumber || '').toLowerCase();
      const subj = (item.subject || '').toLowerCase();
      return sName.includes(q) || sRoll.includes(q) || room.includes(q) || subj.includes(q);
    }
    return true;
  });

  const openCount = complaints.filter(c => c.status === 'OPEN').length;
  const processingCount = complaints.filter(c => c.status === 'PROCESSING').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  const getStatusBadge = (st) => {
    switch (st) {
      case 'OPEN':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Open Ticket</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Resolved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-amber-900 to-rose-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold tracking-wider uppercase mb-1">
            <MessageSquare className="w-4 h-4" /> Grievance Desk
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Hostel Maintenance & Complaints</h1>
          <p className="text-amber-100/80 text-sm mt-1">
            Review resident service requests (plumbing, electrical, mess, cleanliness), assign fixes, and notify students.
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          className="self-start md:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2 text-sm font-medium backdrop-blur-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">Open Tickets</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{openCount}</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">In Progress</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{processingCount}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Resolved</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, room, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="PROCESSING">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Categories</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="CLEANLINESS">Cleanliness</option>
            <option value="MESS_FOOD">Mess / Food</option>
            <option value="INTERNET">Internet / Wi-Fi</option>
            <option value="NOISE">Noise Disturbance</option>
            <option value="SECURITY">Security</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-2" />
          <p className="text-sm font-medium">Loading complaints...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Complaints Found</h3>
          <p className="text-slate-500 text-sm mt-1">All complaints have been addressed or none match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(item => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold text-xs">
                    {item.studentName ? item.studentName.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      By <span className="font-semibold text-slate-700 dark:text-slate-200">{item.studentName || item.studentId?.fullName}</span> (Room {item.roomNumber || 'N/A'}, Roll: {item.rollNumber || 'N/A'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                    {item.category}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                {item.description}
              </p>

              {item.wardenRemarks && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-bold uppercase block text-[10px] text-blue-700 dark:text-blue-400">
                    Warden Reply / Action Taken:
                  </span>
                  <p className="mt-0.5">{item.wardenRemarks}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-400">
                <span>Submitted on {new Date(item.createdAt).toLocaleString('en-IN')}</span>
                <button
                  onClick={() => openReply(item)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition self-end sm:self-auto flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Respond / Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply / Status Modal */}
      {replyModal.open && replyModal.complaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <span>Update Complaint Ticket</span>
              </div>
              <button
                onClick={() => setReplyModal({ open: false, complaint: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateComplaint} className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Subject</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {replyModal.complaint.subject}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Ticket Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                >
                  <option value="OPEN">OPEN (Under Review)</option>
                  <option value="PROCESSING">PROCESSING (Maintenance Worker Dispatched)</option>
                  <option value="RESOLVED">RESOLVED (Fix Complete)</option>
                  <option value="CLOSED">CLOSED (Issue Settled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Warden Reply / Action Notes
                </label>
                <textarea
                  value={replyRemarks}
                  onChange={(e) => setReplyRemarks(e.target.value)}
                  placeholder="Explain resolution steps, technician arrival time, or instructions for the student..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  rows={4}
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyModal({ open: false, complaint: null })}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save & Notify Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WardenComplaints;
