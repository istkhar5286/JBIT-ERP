import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Bell,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Building2,
  Calendar,
  AlertTriangle,
  Info,
  Flame,
  RefreshCw,
  Search
} from 'lucide-react';

export const WardenNotices = () => {
  const [notices, setNotices] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'ANNOUNCEMENT',
    priority: 'NORMAL',
    targetAudience: 'ALL_HOSTELS',
    hostelId: '',
    targetBlock: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [noticesRes, hostelsRes] = await Promise.all([
        api.get('/warden/notices'),
        api.get('/warden/hostels')
      ]);

      if (noticesRes.data?.success) {
        setNotices(noticesRes.data.data || []);
      }
      if (hostelsRes.data?.success) {
        setHostels(hostelsRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch hostel notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await api.post('/warden/notices', form);
      if (res.data?.success) {
        setSuccess('Hostel notice published to residents successfully!');
        setModalOpen(false);
        setForm({
          title: '',
          description: '',
          category: 'ANNOUNCEMENT',
          priority: 'NORMAL',
          targetAudience: 'ALL_HOSTELS',
          hostelId: '',
          targetBlock: ''
        });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/warden/notices/${id}`);
      if (res.data?.success) {
        setSuccess('Notice deleted successfully.');
        setNotices(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete notice');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <Flame className="w-3.5 h-3.5" /> Urgent Alert
          </span>
        );
      case 'HIGH':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> High Priority
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Info className="w-3.5 h-3.5" /> Normal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold tracking-wider uppercase mb-1">
            <Bell className="w-4 h-4" /> Communications
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Hostel Notice Board</h1>
          <p className="text-indigo-200/80 text-sm mt-1">
            Broadcast official announcements, mess schedules, maintenance alerts, and hostel guidelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-1.5 text-sm font-medium backdrop-blur-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Publish Notice
          </button>
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

      {/* Notices List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
          <p className="text-sm font-medium">Loading hostel notices...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Notices Published</h3>
          <p className="text-slate-500 text-sm mt-1">Click "Publish Notice" to post hostel notifications for students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notices.map(notice => (
            <div
              key={notice._id}
              className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border transition shadow-sm hover:shadow-md space-y-3 ${
                notice.priority === 'URGENT'
                  ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {getPriorityBadge(notice.priority)}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {notice.category}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Target: {notice.targetAudience === 'ALL_HOSTELS' ? 'All Hostel Residents' : notice.hostelName || 'Specific Hostel'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {notice.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleDelete(notice._id, notice.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition self-end sm:self-auto"
                  title="Delete notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl">
                {notice.description}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Posted by {notice.postedBy?.name || 'Hostel Warden'}</span>
                <span>{new Date(notice.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Notice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>Publish Notice to Residents</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Mandatory Hostel Roll Call at 8:00 PM"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RULES">Rules & Discipline</option>
                    <option value="MESS_TIMING">Mess Timings</option>
                    <option value="EVENT">Hostel Event</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL_HOSTELS">All Hostels</option>
                    <option value="SPECIFIC_HOSTEL">Specific Hostel</option>
                  </select>
                </div>

                {form.targetAudience === 'SPECIFIC_HOSTEL' && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                      Select Hostel
                    </label>
                    <select
                      value={form.hostelId}
                      onChange={(e) => setForm({ ...form, hostelId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose Hostel...</option>
                      {hostels.map(h => (
                        <option key={h._id} value={h._id}>{h.hostelName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Notice Content / Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide clear notice content for student residents..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WardenNotices;
