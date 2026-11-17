import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { CalendarCheck, Plus, Trash2, Edit2, Search, RefreshCw, BookOpen } from 'lucide-react';

export const AdminAttendance = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [subject, setSubject] = useState('');
  const [totalClasses, setTotalClasses] = useState(40);
  const [attendedClasses, setAttendedClasses] = useState(32);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students', { params: { limit: 100 } });
      if (res.data?.success) {
        setStudents(res.data.data.students);
        if (res.data.data.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(res.data.data.students[0]._id);
          fetchAttendance(res.data.data.students[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const fetchAttendance = async (sId) => {
    if (!sId) return;
    try {
      setLoading(true);
      const res = await api.get(`/admin/attendance/${sId}`);
      if (res.data?.success) {
        setAttendanceRecords(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSelectStudent = (id) => {
    setSelectedStudentId(id);
    fetchAttendance(id);
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setSubject('');
    setTotalClasses(40);
    setAttendedClasses(35);
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setIsEditing(true);
    setEditingId(record._id);
    setSubject(record.subject);
    setTotalClasses(record.totalClasses);
    setAttendedClasses(record.attendedClasses);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(attendedClasses) > Number(totalClasses)) {
      alert('Attended classes cannot exceed total classes');
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/admin/attendance/${editingId}`, {
          subject,
          totalClasses: Number(totalClasses),
          attendedClasses: Number(attendedClasses)
        });
      } else {
        await api.post('/admin/attendance', {
          studentId: selectedStudentId,
          subject,
          totalClasses: Number(totalClasses),
          attendedClasses: Number(attendedClasses)
        });
      }
      setModalOpen(false);
      fetchAttendance(selectedStudentId);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving attendance');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this attendance record?')) {
      try {
        await api.delete(`/admin/attendance/${id}`);
        fetchAttendance(selectedStudentId);
      } catch (err) {
        alert('Failed to delete attendance record');
      }
    }
  };

  const selectedStudent = students.find((s) => s._id === selectedStudentId);

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.universityRollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Attendance Administration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Record, update, and manage subject attendance records with automated percentage calculation
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={!selectedStudentId}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Subject Attendance
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Student Selector */}
        <div className="rounded-2xl bg-white p-5 shadow-soft border border-slate-100 flex flex-col h-[600px]">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredStudents.map((s) => (
              <button
                key={s._id}
                onClick={() => handleSelectStudent(s._id)}
                className={`w-full text-left rounded-xl p-3 border transition-all text-xs ${
                  selectedStudentId === s._id
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-sm'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p>{s.fullName}</p>
                  <span className="font-mono text-[10px] text-slate-500">{s.universityRollNumber}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.course} (Sem {s.semester})</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Attendance Cards for Selected Student */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStudent && (
            <div className="rounded-2xl bg-white p-5 shadow-soft border border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{selectedStudent.fullName}</h3>
                <p className="text-xs text-slate-500">
                  Roll No: <span className="font-mono text-indigo-700 font-bold">{selectedStudent.universityRollNumber}</span> &bull; {selectedStudent.course}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                {attendanceRecords.length} Subjects Enrolled
              </span>
            </div>
          )}

          {loading ? (
            <LoadingSkeleton count={3} height="h-28" />
          ) : attendanceRecords.length === 0 ? (
            <div className="rounded-2xl bg-white p-16 text-center text-xs text-slate-400 border border-slate-100">
              No attendance records found for this student. Click "Add Subject Attendance" above to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attendanceRecords.map((att) => {
                const percentage = att.percentage || 0;
                return (
                  <div
                    key={att._id}
                    className="rounded-2xl bg-white p-5 shadow-soft border border-slate-100 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{att.subject}</h4>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenEdit(att)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(att._id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between items-baseline text-xs mb-1">
                          <span className="text-slate-500 font-medium">Attendance Rate</span>
                          <span className={`font-black text-sm ${percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                      <span>Attended: <strong className="text-emerald-700">{att.attendedClasses}</strong></span>
                      <span>Total Classes: <strong className="text-slate-900">{att.totalClasses}</strong></span>
                      <span>Absent: <strong className="text-rose-600">{Math.max(att.totalClasses - att.attendedClasses, 0)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Attendance Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Update Subject Attendance' : 'Add Subject Attendance'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
              className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Total Classes *</label>
              <input
                type="number"
                min="1"
                required
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Attended Classes *</label>
              <input
                type="number"
                min="0"
                required
                value={attendedClasses}
                onChange={(e) => setAttendedClasses(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
            <span className="text-slate-500">Calculated Percentage: </span>
            <span className="font-extrabold text-indigo-700">
              {totalClasses > 0 ? Math.round(((attendedClasses / totalClasses) * 100) * 100) / 100 : 0}%
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700"
            >
              {isEditing ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
