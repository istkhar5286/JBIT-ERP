import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  Loader2,
  RefreshCw,
  Phone,
  User,
  Calendar,
  Building2,
  Ban
} from 'lucide-react';

export const WardenOutings = () => {
  const [outings, setOutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModal, setActionModal] = useState({ open: false, type: null, outing: null });
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOutings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warden/outings');
      if (res.data?.success) {
        setOutings(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch outing requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutings();
  }, []);

  const openAction = (outing, type) => {
    setActionModal({ open: true, type, outing });
    setRemarks('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!actionModal.outing) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const res = await api.put(`/warden/outings/${actionModal.outing._id}`, {
        status: actionModal.type,
        wardenRemarks: remarks
      });

      if (res.data?.success) {
        setSuccess(`Outing request marked as ${actionModal.type} successfully!`);
        setActionModal({ open: false, type: null, outing: null });
        fetchOutings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update outing status');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = outings.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (item.studentName || item.studentId?.fullName || '').toLowerCase();
      const sRoll = (item.rollNumber || item.studentId?.universityRollNumber || '').toLowerCase();
      const room = (item.roomNumber || '').toLowerCase();
      const reason = (item.reason || '').toLowerCase();
      return sName.includes(q) || sRoll.includes(q) || room.includes(q) || reason.includes(q);
    }
    return true;
  });

  const pendingCount = outings.filter(o => o.status === 'PENDING').length;
  const approvedCount = outings.filter(o => o.status === 'APPROVED').length;
  const completedCount = outings.filter(o => o.status === 'COMPLETED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Pending Approval</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Gate Pass Issued</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Declined</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">Returned</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-teal-900 to-cyan-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-sm font-semibold tracking-wider uppercase mb-1">
            <CalendarCheck className="w-4 h-4" /> Gate Pass & Leave Desk
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Hostel Outings & Night Gate Passes</h1>
          <p className="text-teal-100/80 text-sm mt-1">
            Approve or reject student outing requests, check parent approvals, and record campus returns.
          </p>
        </div>

        <button
          onClick={fetchOutings}
          className="self-start md:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2 text-sm font-medium backdrop-blur-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Pending Requests</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Active Gate Passes</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Completed Returns</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{completedCount}</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
            <Check className="w-6 h-6" />
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

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, roll number, room number, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved / Issued</option>
          <option value="COMPLETED">Completed Return</option>
          <option value="REJECTED">Declined</option>
        </select>
      </div>

      {/* Outings List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-teal-500 mb-2" />
          <p className="text-sm font-medium">Loading outing requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Outings Found</h3>
          <p className="text-slate-500 text-sm mt-1">No outing or gate pass requests match the selected criteria.</p>
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
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-800 dark:text-teal-300 font-bold text-sm">
                    {item.studentName ? item.studentName.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.studentName || item.studentId?.fullName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Roll: {item.rollNumber || item.studentId?.universityRollNumber || 'N/A'} · Room: {item.roomNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                    {item.leaveType || 'DAY_OUTING'}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <div>
                  <span className="block text-slate-400 uppercase font-bold text-[10px]">Departure Time</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.departureDate ? new Date(item.departureDate).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 uppercase font-bold text-[10px]">Expected Return</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.expectedReturnDate ? new Date(item.expectedReturnDate).toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 uppercase font-bold text-[10px]">Parent / Emergency Contact</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-teal-600" />
                    {item.parentContact || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-bold text-xs uppercase text-slate-400 block mb-0.5">Purpose / Reason:</span>
                <p className="italic">"{item.reason}"</p>
              </div>

              {item.wardenRemarks && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 rounded-xl text-xs text-teal-900 dark:text-teal-200">
                  <span className="font-bold uppercase block text-[10px] text-teal-700 dark:text-teal-400">
                    Warden Remarks:
                  </span>
                  <p className="mt-0.5">{item.wardenRemarks}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                <span className="text-slate-400">
                  Requested on {new Date(item.createdAt).toLocaleDateString('en-IN')}
                </span>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {item.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => openAction(item, 'APPROVED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Gate Pass
                      </button>
                      <button
                        onClick={() => openAction(item, 'REJECTED')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold rounded-xl transition flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  )}

                  {item.status === 'APPROVED' && (
                    <button
                      onClick={() => openAction(item, 'COMPLETED')}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Record Student Return
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && actionModal.outing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <CalendarCheck className="w-5 h-5 text-teal-600" />
                <span>
                  {actionModal.type === 'APPROVED'
                    ? 'Issue Gate Pass'
                    : actionModal.type === 'COMPLETED'
                    ? 'Record Hostel Return'
                    : 'Decline Outing Request'}
                </span>
              </div>
              <button
                onClick={() => setActionModal({ open: false, type: null, outing: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Student: <span className="font-bold text-slate-900 dark:text-white">{actionModal.outing.studentName || actionModal.outing.studentId?.fullName}</span>
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Warden Instructions / Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    actionModal.type === 'APPROVED'
                      ? 'e.g. Return strictly before 8:30 PM. Carry student ID card.'
                      : actionModal.type === 'REJECTED'
                      ? 'Reason for denial (e.g. Exam tomorrow, parent did not confirm)'
                      : 'Arrival condition or notes...'
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  required={actionModal.type === 'REJECTED'}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, type: null, outing: null })}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 ${
                    actionModal.type === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : actionModal.type === 'COMPLETED'
                      ? 'bg-teal-600 hover:bg-teal-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WardenOutings;
