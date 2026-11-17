import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Edit2,
  Loader2,
  X,
  RefreshCw,
  Power,
  GraduationCap
} from 'lucide-react';

export const AdminWardens = () => {
  const [wardens, setWardens] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignModal, setAssignModal] = useState({ open: false, warden: null });
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wardensRes, hostelsRes] = await Promise.all([
        api.get('/admin/wardens'),
        api.get('/hostel/options')
      ]);

      if (wardensRes.data?.success) {
        setWardens(wardensRes.data.data || []);
      }
      if (hostelsRes.data?.success) {
        setHostels(hostelsRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch wardens list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (wardenId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      setError('');
      setSuccess('');
      const res = await api.put(`/admin/wardens/${wardenId}/status`, { status: newStatus });
      if (res.data?.success) {
        setSuccess(`Warden status changed to ${newStatus.toUpperCase()}`);
        setWardens(prev => prev.map(w => (w._id === wardenId ? { ...w, status: newStatus } : w)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update warden status');
    }
  };

  const openAssignModal = (warden) => {
    setAssignModal({ open: true, warden });
    const match = hostels.find(h => h.hostelName === warden.hostelAssigned || h._id === warden.hostelId);
    setSelectedHostelId(match?._id || (hostels[0]?._id || ''));
  };

  const handleAssignHostel = async (e) => {
    e.preventDefault();
    if (!assignModal.warden || !selectedHostelId) return;

    const hostel = hostels.find(h => h._id === selectedHostelId);
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const res = await api.put(`/admin/wardens/${assignModal.warden._id}/assign`, {
        hostelId: selectedHostelId,
        hostelAssigned: hostel ? hostel.hostelName : ''
      });

      if (res.data?.success) {
        setSuccess(`Hostel ${hostel?.hostelName || ''} successfully assigned to ${assignModal.warden.fullName}`);
        setAssignModal({ open: false, warden: null });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign hostel to warden');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = wardens.filter(w => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (w.fullName || '').toLowerCase();
    const emp = (w.employeeId || '').toLowerCase();
    const email = (w.email || '').toLowerCase();
    const mob = (w.mobile || '').toLowerCase();
    const hostel = (w.hostelAssigned || '').toLowerCase();
    return name.includes(q) || emp.includes(q) || email.includes(q) || mob.includes(q) || hostel.includes(q);
  });

  const totalCount = wardens.length;
  const activeCount = wardens.filter(w => w.status === 'active').length;
  const assignedCount = wardens.filter(w => w.hostelAssigned && w.hostelAssigned.trim() !== '').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold tracking-wider uppercase mb-1">
            <Shield className="w-4 h-4" /> Administration Desk
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Warden Role & Hostel Assignment Master</h1>
          <p className="text-slate-300 text-sm mt-1">
            Manage hostel warden accounts, control portal access, verify email credentials, and allocate residential buildings.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="self-start md:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2 text-sm font-medium backdrop-blur-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Registered Wardens</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-600">Active Portals</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-indigo-600">Hostels Assigned</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{assignedCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
            <Building2 className="w-6 h-6" />
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

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by warden name, employee ID, email, or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Wardens Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
          <p className="text-sm font-medium">Loading warden directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Wardens Found</h3>
          <p className="text-slate-500 text-sm mt-1">Wardens register at /warden/register with Gmail OTP.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  <th className="p-4">Warden Details</th>
                  <th className="p-4">Employee ID & Email</th>
                  <th className="p-4">Assigned Hostel</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {filtered.map(w => {
                  const isActive = w.status === 'active';

                  return (
                    <tr key={w._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-800 dark:text-indigo-300 font-bold text-sm flex-shrink-0">
                            {w.profilePhoto ? (
                              <img src={w.profilePhoto} alt={w.fullName} className="w-full h-full object-cover" />
                            ) : (
                              w.fullName?.charAt(0) || 'W'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {w.fullName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{w.designation || 'Warden'}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" /> {w.mobile}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {w.employeeId}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{w.email}</span>
                          {w.emailVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Email Verified" />
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {w.hostelAssigned ? (
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                            <span>{w.hostelAssigned}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {w.status || 'active'}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => openAssignModal(w)}
                          className="px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-lg transition inline-flex items-center gap-1"
                          title="Assign or reassign hostel"
                        >
                          <Building2 className="w-3.5 h-3.5" /> Assign Hostel
                        </button>

                        <button
                          onClick={() => handleToggleStatus(w._id, w.status)}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition inline-flex items-center gap-1 ${
                            isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                          title={isActive ? 'Deactivate warden' : 'Activate warden'}
                        >
                          <Power className="w-3.5 h-3.5" /> {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Hostel Modal */}
      {assignModal.open && assignModal.warden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Assign Hostel Building</span>
              </div>
              <button
                onClick={() => setAssignModal({ open: false, warden: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignHostel} className="p-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Warden: <strong className="text-slate-900 dark:text-white">{assignModal.warden.fullName}</strong> ({assignModal.warden.employeeId})
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Select Hostel to Assign
                </label>
                <select
                  value={selectedHostelId}
                  onChange={(e) => setSelectedHostelId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {hostels.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.hostelName} ({h.hostelType || 'Hostel'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignModal({ open: false, warden: null })}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminWardens;
