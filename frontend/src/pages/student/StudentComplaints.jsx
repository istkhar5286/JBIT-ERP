import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MessageSquare, Plus, CheckCircle2, Clock, AlertCircle, Loader2, Send } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const StudentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    category: 'ACADEMIC',
    subject: '',
    description: '',
    attachment: ''
  });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/complaints');
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
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/student/complaints', form);
      if (res.data?.success) {
        setSuccess('Grievance ticket registered. Administration will review promptly.');
        setShowModal(false);
        setForm({
          category: 'ACADEMIC',
          subject: '',
          description: '',
          attachment: ''
        });
        fetchComplaints();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit grievance');
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-indigo-600" />
            Student Helpdesk & Grievance Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit inquiries, fee ledger discrepancy reports, hostel issues, or academic requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Grievance Ticket</span>
        </button>
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
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">No grievance tickets raised</p>
            <p className="text-xs text-slate-400 mt-0.5">If you face any issue regarding fees, classes, hostel, or transport, submit a ticket above.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <div
              key={c._id}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700">
                    {c.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    c.status === 'RESOLVED' || c.status === 'CLOSED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : c.status === 'PROCESSING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Raised on: {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h2 className="text-sm font-bold text-slate-900">{c.subject}</h2>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {c.description}
              </p>

              {/* Admin response block if available */}
              {c.adminResponse ? (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                    Administration Response ({c.assignedTo || 'Helpdesk'})
                  </p>
                  <p className="text-xs text-slate-700 font-medium">
                    {c.adminResponse}
                  </p>
                  {c.resolvedAt && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Resolved: {new Date(c.resolvedAt).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold pt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Ticket is under review by college administration</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">Submit Grievance or Inquiry</h2>
            <p className="text-xs text-slate-500 mb-4">Your message will be sent directly to the relevant department superintendent.</p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="ACADEMIC">Academic / Classes / Attendance</option>
                  <option value="FEES">Fee Ledger & Payment Receipts</option>
                  <option value="HOSTEL">Hostel & Mess Facilities</option>
                  <option value="TRANSPORT">College Transport & Bus Route</option>
                  <option value="INFRASTRUCTURE">Campus Infrastructure & Labs</option>
                  <option value="LIBRARY">Central Library Books</option>
                  <option value="OTHER">General Administration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief summary of your grievance"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Detailed Explanation</label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide complete details, transaction references or dates..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
