import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ClipboardList, Plus, Calendar, Clock, MapPin, Trash2, Edit2, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    examName: 'End Term University Theory Examination',
    academicYear: '2024-2025',
    course: 'B.Tech Computer Science & Engineering',
    semester: '1',
    subject: '',
    subjectCode: '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    room: 'Main Examination Hall',
    maxMarks: 100,
    passingMarks: 40,
    type: 'END_TERM'
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/exams');
      if (res.data?.success) {
        setExams(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load exam schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      examName: 'End Term University Theory Examination',
      academicYear: '2024-2025',
      course: 'B.Tech Computer Science & Engineering',
      semester: '1',
      subject: '',
      subjectCode: '',
      examDate: new Date().toISOString().split('T')[0],
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      room: 'Main Examination Hall',
      maxMarks: 100,
      passingMarks: 40,
      type: 'END_TERM'
    });
    setShowModal(true);
    setError('');
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setForm({
      examName: item.examName,
      academicYear: item.academicYear || '2024-2025',
      course: item.course,
      semester: item.semester,
      subject: item.subject,
      subjectCode: item.subjectCode || '',
      examDate: new Date(item.examDate).toISOString().split('T')[0],
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room || 'Main Examination Hall',
      maxMarks: item.maxMarks || 100,
      passingMarks: item.passingMarks || 40,
      type: item.type || 'END_TERM'
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
        const res = await api.put(`/admin/exams/${editingId}`, form);
        if (res.data?.success) {
          setSuccess('Exam schedule updated successfully');
          setShowModal(false);
          fetchExams();
        }
      } else {
        const res = await api.post('/admin/exams', form);
        if (res.data?.success) {
          setSuccess('New exam date scheduled and reflected in student admit cards');
          setShowModal(false);
          fetchExams();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this examination entry?')) return;
    try {
      const res = await api.delete(`/admin/exams/${id}`);
      if (res.data?.success) {
        setExams((prev) => prev.filter((e) => e._id !== id));
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
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            University Examination Schedules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure examination schedules, venues, and timings. Directly populates generated Admit Cards.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule New Exam</span>
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

      {/* Exams Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No examination papers scheduled yet. Click 'Schedule New Exam' above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Exam Name</th>
                  <th className="py-3 px-4">Subject & Code</th>
                  <th className="py-3 px-4">Course & Semester</th>
                  <th className="py-3 px-4">Exam Date</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4 text-center">Marks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((ex) => (
                  <tr key={ex._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{ex.examName}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{ex.subject}</p>
                      {ex.subjectCode && (
                        <span className="font-mono text-[10px] text-indigo-600 font-semibold">{ex.subjectCode}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ex.course} &bull; Sem {ex.semester}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {new Date(ex.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {ex.startTime} - {ex.endTime}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {ex.room || 'Main Hall'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {ex.passingMarks} / {ex.maxMarks}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ex)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ex._id)}
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
                {editingId ? 'Edit Exam Schedule' : 'Schedule University Exam'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Exam Series Title</label>
                <input
                  type="text"
                  required
                  value={form.examName}
                  onChange={(e) => setForm({ ...form, examName: e.target.value })}
                  placeholder="e.g. End Term University Theory Examination"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Course</label>
                  <input
                    type="text"
                    required
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Semester</label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Data Structures"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject Code</label>
                  <input
                    type="text"
                    value={form.subjectCode}
                    onChange={(e) => setForm({ ...form, subjectCode: e.target.value.toUpperCase() })}
                    placeholder="BCS-301"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={form.examDate}
                    onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">End Time</label>
                  <input
                    type="text"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    placeholder="01:00 PM"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Room / Venue</label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="Exam Hall 1"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={form.maxMarks}
                    onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    value={form.passingMarks}
                    onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
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
                  <span>Save Exam Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
