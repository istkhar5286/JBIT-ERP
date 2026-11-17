import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  User,
  LogOut,
  Download,
  Calendar,
  Building2,
  X,
  RefreshCw,
  FileCheck
} from 'lucide-react';

export const WardenAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [hostelFilter, setHostelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vacateModal, setVacateModal] = useState({ open: false, allocation: null });
  const [vacateReason, setVacateReason] = useState('Course completion / End of semester');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocRes, hostelsRes] = await Promise.all([
        api.get(`/warden/allocations?status=${statusFilter}`),
        api.get('/warden/hostels')
      ]);

      if (allocRes.data?.success) {
        setAllocations(allocRes.data.data || []);
      }
      if (hostelsRes.data?.success) {
        setHostels(hostelsRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch allocations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleVacate = async (e) => {
    e.preventDefault();
    if (!vacateModal.allocation) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const res = await api.post(`/warden/allocations/${vacateModal.allocation._id}/vacate`, {
        vacateReason
      });

      if (res.data?.success) {
        setSuccess('Hostel allocation marked as VACATED and bed released to AVAILABLE!');
        setVacateModal({ open: false, allocation: null });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to vacate hostel allocation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadCard = async (allocationId) => {
    try {
      const response = await api.get(`/hostel/allocation-card/${allocationId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hostel_Allocation_Card_${allocationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download allocation card.');
    }
  };

  const filtered = allocations.filter(item => {
    if (hostelFilter !== 'ALL') {
      const hId = item.hostelId?._id || item.hostelId;
      if (hId !== hostelFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (item.studentId?.fullName || item.studentName || '').toLowerCase();
      const sRoll = (item.studentId?.universityRollNumber || item.rollNumber || '').toLowerCase();
      const room = (item.roomNumber || '').toLowerCase();
      const bed = (item.bedNumber || '').toLowerCase();
      return sName.includes(q) || sRoll.includes(q) || room.includes(q) || bed.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-teal-900 to-emerald-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold tracking-wider uppercase mb-1">
            <Users className="w-4 h-4" /> Student Residents
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Hostel Allocations & Vacating Desk</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Track active student residents, room assignments, print official allocation cards, and process checkout / vacating.
          </p>
        </div>

        <button
          onClick={fetchData}
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

      {/* Tabs and Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Active Residents
          </button>
          <button
            onClick={() => setStatusFilter('VACATED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              statusFilter === 'VACATED'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Vacated History
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Records
          </button>
        </div>

        {/* Search & Hostel Selector */}
        <div className="flex flex-1 md:justify-end items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resident or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Hostels</option>
            {hostels.map(h => (
              <option key={h._id} value={h._id}>{h.hostelName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm font-medium">Fetching allocation records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Allocations Found</h3>
          <p className="text-slate-500 text-sm mt-1">
            {statusFilter === 'ACTIVE'
              ? 'No active residents currently found in this hostel.'
              : 'No historical records match your filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  <th className="p-4">Student Resident</th>
                  <th className="p-4">Hostel / Location</th>
                  <th className="p-4">Room & Bed</th>
                  <th className="p-4">Allocated Date</th>
                  <th className="p-4">Status / Vacated Info</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {filtered.map(item => {
                  const isActive = item.status === 'ACTIVE';
                  const student = item.studentId;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                            {student?.fullName ? student.fullName.charAt(0) : 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {student?.fullName || item.studentName || 'Student'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Roll: {student?.universityRollNumber || item.rollNumber || 'N/A'} · {student?.course || ''}
                            </div>
                            <div className="text-xs text-slate-400">
                              Mob: {student?.mobile || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.hostelName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.block} · {item.floor}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
                          Room {item.roomNumber} ({item.bedNumber})
                        </span>
                      </td>

                      <td className="p-4 text-xs text-slate-500">
                        {item.allocationDate ? new Date(item.allocationDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>

                      <td className="p-4">
                        {isActive ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Active Resident
                          </span>
                        ) : (
                          <div>
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                              Vacated
                            </span>
                            {item.vacatedDate && (
                              <div className="text-[11px] text-slate-400 mt-1">
                                On: {new Date(item.vacatedDate).toLocaleDateString('en-IN')}
                              </div>
                            )}
                            {item.vacateReason && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5">
                                "{item.vacateReason}"
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleDownloadCard(item._id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition inline-flex items-center"
                          title="Download Allocation Card PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {isActive && (
                          <button
                            onClick={() => setVacateModal({ open: true, allocation: item })}
                            className="px-3 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg transition inline-flex items-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Vacate Bed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vacate Hostel Modal */}
      {vacateModal.open && vacateModal.allocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200">
                <LogOut className="w-5 h-5 text-rose-600" />
                <span>Vacate Student from Hostel</span>
              </div>
              <button
                onClick={() => setVacateModal({ open: false, allocation: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVacate} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {vacateModal.allocation.studentId?.fullName || vacateModal.allocation.studentName}
                </p>
                <p className="text-slate-500">
                  Hostel: {vacateModal.allocation.hostelName} · Room {vacateModal.allocation.roomNumber} ({vacateModal.allocation.bedNumber})
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs rounded-xl border border-amber-200 dark:border-amber-800">
                Notice: Vacating will immediately release Room {vacateModal.allocation.roomNumber} ({vacateModal.allocation.bedNumber}) back to AVAILABLE status in the bed inventory, while preserving historical records.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Reason for Vacating
                </label>
                <select
                  value={vacateReason}
                  onChange={(e) => setVacateReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Course completion / End of semester">Course completion / End of semester</option>
                  <option value="Personal request by student/guardian">Personal request by student/guardian</option>
                  <option value="Hostel transfer / room reassignment">Hostel transfer / room reassignment</option>
                  <option value="Disciplinary departure">Disciplinary departure</option>
                  <option value="Other / Non-reporting">Other / Non-reporting</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setVacateModal({ open: false, allocation: null })}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Vacate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WardenAllocations;
