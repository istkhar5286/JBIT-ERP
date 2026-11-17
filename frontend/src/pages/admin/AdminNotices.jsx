import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, Plus, FileText, Calendar, Trash2, Edit2, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    targetCourse: '',
    attachment: '',
    attachmentName: ''
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/notices');
      if (res.data?.success) {
        setNotices(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Attachment must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({
        ...prev,
        attachment: event.target.result,
        attachmentName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      category: 'GENERAL',
      priority: 'NORMAL',
      targetAudience: 'ALL',
      targetCourse: '',
      attachment: '',
      attachmentName: ''
    });
    setShowModal(true);
    setError('');
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      targetAudience: item.targetAudience,
      targetCourse: item.targetCourse || '',
      attachment: item.attachment || '',
      attachmentName: item.attachmentName || ''
    });
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        const res = await api.put(`/admin/notices/${editingId}`, form);
        if (res.data?.success) {
          setSuccess('Notice updated successfully');
          setShowModal(false);
          fetchNotices();
        }
      } else {
        const res = await api.post('/admin/notices', form);
        if (res.data?.success) {
          setSuccess('Notice published to campus board and student/faculty portals');
          setShowModal(false);
          fetchNotices();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campus notice?')) return;
    try {
      const res = await api.delete(`/admin/notices/${id}`);
      if (res.data?.success) {
        setNotices((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-indigo-600" />
            Institutional Notice Board Publisher
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast official administrative circulars, fee deadlines, exam alerts, and holiday notices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Notice</span>
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

      {/* Notices Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : notices.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No notices published yet. Click 'Publish Notice' above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Notice Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Target Audience</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map((n) => (
                  <tr key={n._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 line-clamp-1">{n.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{n.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {n.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        n.priority === 'HIGH' ? 'bg-rose-100 text-rose-800 font-black' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {n.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {n.targetAudience} {n.targetCourse ? `(${n.targetCourse})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(n)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(n._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900">
                {editingId ? 'Edit Campus Notice' : 'Publish New Notice'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Schedule of University End-Semester Theory Exams 2024-25"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Notice Body / Circular Details</label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed text of the circular..."
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="EXAMINATION">Examination</option>
                    <option value="FEES">Fees & Accounts</option>
                    <option value="EVENTS">Events & Fests</option>
                    <option value="HOLIDAYS">Holidays</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Urgent / High</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Audience</label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="ALL">All Campus (Students & Faculty)</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="FACULTY">Faculty Only</option>
                    <option value="COURSE_SPECIFIC">Course Specific</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Specific Course (Optional)</label>
                  <input
                    type="text"
                    value={form.targetCourse}
                    onChange={(e) => setForm({ ...form, targetCourse: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Circular PDF Document</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {form.attachmentName && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Attached: {form.attachmentName}</p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
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
                  <span>{editingId ? 'Save Changes' : 'Publish Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
