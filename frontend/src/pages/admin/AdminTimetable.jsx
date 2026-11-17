import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Plus, Clock, MapPin, User, Trash2, Edit2, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { BRANDING } from '../../config/branding';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AdminTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeDay, setActiveDay] = useState('Monday');
  const [courseFilter, setCourseFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    day: 'Monday',
    timeSlot: '09:00 AM - 10:00 AM',
    course: 'B.Tech Computer Science & Engineering',
    branch: 'CSE',
    semester: '3',
    section: 'A',
    subject: '',
    subjectCode: '',
    room: 'LH-101',
    facultyId: '',
    facultyName: ''
  });

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const [tRes, fRes] = await Promise.all([
        api.get('/admin/timetable', {
          params: {
            day: activeDay,
            course: courseFilter,
            semester: semesterFilter
          }
        }),
        api.get('/admin/faculty')
      ]);
      if (tRes.data?.success) setTimetable(tRes.data.data || []);
      if (fRes.data?.success) setFacultyList(fRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [activeDay, courseFilter, semesterFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      day: activeDay,
      timeSlot: '09:00 AM - 10:00 AM',
      course: courseFilter || 'B.Tech Computer Science & Engineering',
      branch: 'CSE',
      semester: semesterFilter || '3',
      section: 'A',
      subject: '',
      subjectCode: '',
      room: 'LH-101',
      facultyId: facultyList[0]?._id || '',
      facultyName: facultyList[0]?.name || ''
    });
    setShowModal(true);
    setError('');
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setForm({
      day: item.day,
      timeSlot: item.timeSlot,
      course: item.course,
      branch: item.branch || '',
      semester: item.semester,
      section: item.section || 'A',
      subject: item.subject,
      subjectCode: item.subjectCode || '',
      room: item.room || 'LH-101',
      facultyId: item.facultyId || '',
      facultyName: item.facultyName || ''
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
        const res = await api.put(`/admin/timetable/${editingId}`, form);
        if (res.data?.success) {
          setSuccess('Timetable slot updated successfully');
          setShowModal(false);
          fetchTimetable();
        }
      } else {
        const res = await api.post('/admin/timetable', form);
        if (res.data?.success) {
          setSuccess('New lecture slot scheduled');
          setShowModal(false);
          fetchTimetable();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Timetable operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      const res = await api.delete(`/admin/timetable/${id}`);
      if (res.data?.success) {
        setTimetable((prev) => prev.filter((t) => t._id !== id));
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
            <Calendar className="h-6 w-6 text-indigo-600" />
            Timetable & Class Schedule Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Schedule lectures, allocate classrooms, assign professors, and publish student timetables.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lecture Slot</span>
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

      {/* Day Tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setActiveDay(d)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeDay === d
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Grid of Slots */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="text-base font-black text-slate-900 mb-4 flex items-center justify-between">
          <span>Schedule on {activeDay}</span>
          <span className="text-xs font-bold text-slate-400">{timetable.length} lecture slots</span>
        </h2>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : timetable.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <Calendar className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No lecture slots on {activeDay}</p>
            <p className="text-xs text-slate-400 mt-0.5">Click 'Add Lecture Slot' above to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetable.map((slot) => (
              <div
                key={slot._id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
                      <Clock className="h-3 w-3" />
                      {slot.timeSlot}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      {slot.room || 'LH-101'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{slot.subject}</h3>
                  {slot.subjectCode && (
                    <p className="text-[10px] font-mono text-indigo-600 font-semibold">{slot.subjectCode}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {slot.course} &bull; Sem {slot.semester} (Sec {slot.section || 'A'})
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-2 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{slot.facultyName || 'Unassigned Faculty'}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(slot)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(slot._id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900">
                {editingId ? 'Edit Timetable Slot' : 'Schedule New Timetable Slot'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Day of Week</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    placeholder="09:00 AM - 10:00 AM"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Course Program</label>
                <input
                  type="text"
                  required
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Section</label>
                  <input
                    type="text"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    placeholder="A"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject Title</label>
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
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs uppercase font-mono focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Room / Venue</label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="LH-101 / CS Lab 2"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Assign Professor</label>
                  <select
                    value={form.facultyId}
                    onChange={(e) => {
                      const fac = facultyList.find((f) => f._id === e.target.value);
                      setForm({
                        ...form,
                        facultyId: e.target.value,
                        facultyName: fac?.name || ''
                      });
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="">Select Faculty...</option>
                    {facultyList.map((f) => (
                      <option key={f._id} value={f._id}>{f.name} ({f.department})</option>
                    ))}
                  </select>
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
                  <span>{editingId ? 'Save Changes' : 'Schedule Slot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
