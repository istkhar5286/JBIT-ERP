import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MessageSquare, CheckCircle2, Clock, AlertCircle, Loader2, Send, X, User } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseForm, setResponseForm] = useState({
    adminResponse: '',
    assignedTo: 'Helpdesk & Student Welfare',
    status: 'RESOLVED'
  });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/complaints', {
        params: { status: statusFilter }
      });
      if (res.data?.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleOpenRespond = (ticket) => {
    setSelectedTicket(ticket);
    setResponseForm({
      adminResponse: ticket.adminResponse || '',
      assignedTo: ticket.assignedTo || 'Helpdesk & Student Welfare',
      status: ticket.status === 'OPEN' ? 'PROCESSING' : ticket.status
    });
    setError('');
  };

  const handleSaveResponse = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put(`/admin/complaints/${selectedTicket._id}/respond`, responseForm);
      if (res.data?.success) {
        setSuccess('Response sent to student and status updated');
        setSelectedTicket(null);
        fetchComplaints();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update response');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-indigo-600" />
            Student Grievance & Helpdesk Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review submitted student tickets, route to relevant department, and furnish administrative resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open Tickets</option>
            <option value="PROCESSING">Processing</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">No grievance tickets pending</p>
            <p className="text-xs text-slate-400 mt-0.5">All student requests are resolved or no tickets match the current filter.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <div
              key={c._id}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700">
                    {c.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    c.status === 'RESOLVED' || c.status === 'CLOSED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : c.status === 'PROCESSING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800 font-bold'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-bold text-slate-900">{c.studentName || c.studentId?.fullName}</span>
                <span>&bull;</span>
                <span className="font-mono text-indigo-600 font-bold">{c.rollNumber || c.studentId?.universityRollNumber}</span>
                <span>&bull;</span>
                <span>Course: {c.studentId?.course || 'Student'} (Sem {c.studentId?.semester || 1})</span>
              </div>

              <h2 className="text-sm font-black text-slate-900">{c.subject}</h2>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {c.description}
              </p>

              {c.adminResponse && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Recorded Administrative Resolution ({c.assignedTo})
                  </p>
                  <p className="text-xs text-slate-700 font-medium">
                    {c.adminResponse}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenRespond(c)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
                >
                  {c.adminResponse ? 'Update Response / Status' : 'Respond to Ticket'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-slate-900">Respond to Grievance Ticket</h2>
              <button type="button" onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-700 mb-1">Subject: {selectedTicket.subject}</p>
            <p className="text-xs text-slate-500 mb-4">From: {selectedTicket.studentName} ({selectedTicket.rollNumber})</p>

            <form onSubmit={handleSaveResponse} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Assigned Department</label>
                <input
                  type="text"
                  required
                  value={responseForm.assignedTo}
                  onChange={(e) => setResponseForm({ ...responseForm, assignedTo: e.target.value })}
                  placeholder="e.g. Accounts Division / Examination Cell"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Ticket Status</label>
                <select
                  value={responseForm.status}
                  onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="PROCESSING">Processing / Under Investigation</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed / Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Resolution Response Message</label>
                <textarea
                  rows={4}
                  required
                  value={responseForm.adminResponse}
                  onChange={(e) => setResponseForm({ ...responseForm, adminResponse: e.target.value })}
                  placeholder="Enter official resolution or status update visible to the student..."
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Resolution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
