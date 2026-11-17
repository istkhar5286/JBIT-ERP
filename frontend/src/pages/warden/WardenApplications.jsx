import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  User,
  CreditCard,
  Building2,
  BedDouble,
  X,
  RefreshCw,
  Eye,
  Check,
  Ban
} from 'lucide-react';

export const WardenApplications = () => {
  const [applications, setApplications] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: null, app: null });
  const [selectedBedId, setSelectedBedId] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warden/applications');
      if (res.data?.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBedsForHostel = async (hostelId) => {
    try {
      const res = await api.get(`/warden/beds?hostelId=${hostelId}&status=AVAILABLE`);
      if (res.data?.success) {
        setAvailableBeds(res.data.data || []);
        if (res.data.data.length > 0) {
          setSelectedBedId(res.data.data[0]._id);
        } else {
          setSelectedBedId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openActionModal = (app, type) => {
    setActionModal({ open: true, type, app });
    setActionRemarks('');
    if (type === 'ALLOCATE') {
      const hId = app.hostelId?._id || app.hostelId;
      fetchAvailableBedsForHostel(hId);
    }
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!actionModal.app) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        action: actionModal.type,
        remarks: actionRemarks
      };
      if (actionModal.type === 'ALLOCATE' && selectedBedId) {
        payload.bedId = selectedBedId;
      }

      const res = await api.post(`/warden/applications/${actionModal.app._id}/process`, payload);
      if (res.data?.success) {
        setSuccess(`Application marked as ${actionModal.type} successfully!`);
        setActionModal({ open: false, type: null, app: null });
        fetchApplications();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process application');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = applications.filter(app => {
    if (filterStatus !== 'ALL' && app.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (app.studentName || app.studentId?.fullName || '').toLowerCase();
      const sRoll = (app.studentRoll || app.studentId?.universityRollNumber || '').toLowerCase();
      const hName = (app.hostelName || '').toLowerCase();
      return sName.includes(q) || sRoll.includes(q) || hName.includes(q);
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ALLOCATED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Allocated</span>;
      case 'PAYMENT_SUCCESSFUL':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Paid - Awaiting Bed</span>;
      case 'PENDING_PAYMENT':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Pending Payment</span>;
      case 'WAITLISTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">Waitlisted</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-sm font-semibold tracking-wider uppercase mb-1">
            <FileText className="w-4 h-4" /> Applications Desk
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Hostel Admission Applications</h1>
          <p className="text-blue-200/80 text-sm mt-1">
            Review submitted student applications, verify fee payments, assign available beds, or manage waitlists.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="self-start md:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2 text-sm font-medium backdrop-blur-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
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

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or hostel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="PAYMENT_SUCCESSFUL">Payment Successful (Awaiting Bed)</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-2" />
          <p className="text-sm font-medium">Fetching applications list...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Applications Found</h3>
          <p className="text-slate-500 text-sm mt-1">There are no hostel applications matching your selected criteria.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  <th className="p-4">Student Info</th>
                  <th className="p-4">Hostel Preference</th>
                  <th className="p-4">Fee / Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {filtered.map(app => (
                  <tr key={app._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {app.studentName || app.studentId?.fullName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Roll: {app.studentRoll || app.studentId?.universityRollNumber || 'N/A'} · {app.studentCourse || app.studentId?.course || ''}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{app.studentEmail}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {app.hostelName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Room: {app.preferredRoomType || 'STANDARD'}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        ₹{Number(app.paymentAmount || 45000).toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {app.paymentStatus === 'PAID' ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Paid Online
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Pending</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      {getStatusBadge(app.status)}
                    </td>

                    <td className="p-4 text-xs text-slate-500">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition inline-flex items-center"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {(app.status === 'PAYMENT_SUCCESSFUL' || app.status === 'WAITLISTED') && (
                        <>
                          <button
                            onClick={() => openActionModal(app, 'ALLOCATE')}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition inline-flex items-center gap-1"
                            title="Assign Bed"
                          >
                            <Check className="w-3.5 h-3.5" /> Allocate
                          </button>
                          {app.status !== 'WAITLISTED' && (
                            <button
                              onClick={() => openActionModal(app, 'WAITLIST')}
                              className="px-2.5 py-1 text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-lg transition inline-flex items-center gap-1"
                            >
                              Waitlist
                            </button>
                          )}
                          <button
                            onClick={() => openActionModal(app, 'REJECT')}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition inline-flex items-center"
                            title="Decline Application"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Detail View Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Application Details</span>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl">
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                    {selectedApp.studentName || selectedApp.studentId?.fullName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Roll: {selectedApp.studentRoll || selectedApp.studentId?.universityRollNumber} · {selectedApp.studentCourse}
                  </p>
                </div>
                <div>{getStatusBadge(selectedApp.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Hostel Requested</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.hostelName}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Room Preference</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.preferredRoomType || 'STANDARD'}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Contact Mobile</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.studentMobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.studentEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Fee Amount</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">₹{selectedApp.paymentAmount || 45000}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Payment Status</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.paymentStatus || 'PENDING'}</span>
                </div>
              </div>

              {selectedApp.allocationDetails && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-200 block uppercase mb-1">
                    Current Bed Allocation
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Hostel: {selectedApp.allocationDetails.hostelName} | Block: {selectedApp.allocationDetails.block} | Floor: {selectedApp.allocationDetails.floor} | Room: {selectedApp.allocationDetails.roomNumber} | Bed: {selectedApp.allocationDetails.bedNumber}
                  </p>
                </div>
              )}

              {selectedApp.rejectionReason && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                  <span className="font-bold block uppercase mb-1">Rejection Reason:</span>
                  <p>{selectedApp.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Process Modal (Allocate / Reject / Waitlist) */}
      {actionModal.open && actionModal.app && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                {actionModal.type === 'ALLOCATE' && <Check className="w-5 h-5 text-emerald-600" />}
                {actionModal.type === 'WAITLIST' && <Clock className="w-5 h-5 text-purple-600" />}
                {actionModal.type === 'REJECT' && <Ban className="w-5 h-5 text-rose-600" />}
                <span>
                  {actionModal.type === 'ALLOCATE' ? 'Allocate Hostel Bed' : actionModal.type === 'WAITLIST' ? 'Waitlist Student' : 'Decline Application'}
                </span>
              </div>
              <button
                onClick={() => setActionModal({ open: false, type: null, app: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcess} className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Candidate: <span className="font-bold text-slate-900 dark:text-white">{actionModal.app.studentName || actionModal.app.studentId?.fullName}</span> ({actionModal.app.hostelName})
              </p>

              {actionModal.type === 'ALLOCATE' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Select Available Bed
                  </label>
                  {availableBeds.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                      No available beds found in this hostel right now. The system will auto-search or you can add beds first.
                    </div>
                  ) : (
                    <select
                      value={selectedBedId}
                      onChange={(e) => setSelectedBedId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      {availableBeds.map(b => (
                        <option key={b._id} value={b._id}>
                          {b.bedIdentifier} - {b.block}, {b.floor}, Room {b.roomNumber} ({b.roomType})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  {actionModal.type === 'REJECT' ? 'Reason for Rejection *' : 'Remarks / Note'}
                </label>
                <textarea
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder={actionModal.type === 'REJECT' ? 'Provide clear reason for rejection...' : 'Optional notes for student...'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required={actionModal.type === 'REJECT'}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, type: null, app: null })}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50 ${
                    actionModal.type === 'ALLOCATE'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : actionModal.type === 'WAITLIST'
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm {actionModal.type}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WardenApplications;
