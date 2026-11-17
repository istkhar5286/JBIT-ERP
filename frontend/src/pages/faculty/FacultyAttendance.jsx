import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Users
} from 'lucide-react';

export const FacultyAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState({
    course: '',
    branch: '',
    semester: '',
    section: 'A',
    subject: ''
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // studentId -> 'PRESENT' | 'ABSENT' | 'LATE'
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await api.get('/faculty/classes');
        if (res.data?.success && res.data.data.length > 0) {
          const list = res.data.data;
          setClasses(list);
          const first = list[0];
          setSelectedClass({
            course: first.course,
            branch: first.branch || '',
            semester: first.semester,
            section: first.section || 'A',
            subject: first.subject || ''
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAssigned();
  }, []);

  const loadStudents = async () => {
    if (!selectedClass.course || !selectedClass.semester) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.get('/faculty/students', {
        params: {
          course: selectedClass.course,
          branch: selectedClass.branch,
          semester: selectedClass.semester,
          section: selectedClass.section
        }
      });
      if (res.data?.success) {
        const list = res.data.data || [];
        setStudents(list);

        // Default all to PRESENT
        const initialMap = {};
        list.forEach((st) => {
          initialMap[st._id] = 'PRESENT';
        });
        setAttendanceMap(initialMap);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass.course) {
      loadStudents();
    }
  }, [selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((st) => {
      updated[st._id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass.subject) {
      setError('Please specify the subject for attendance marking');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const records = students.map((st) => ({
        studentId: st._id,
        status: attendanceMap[st._id] || 'PRESENT'
      }));

      const payload = {
        course: selectedClass.course,
        branch: selectedClass.branch,
        semester: selectedClass.semester,
        section: selectedClass.section,
        subject: selectedClass.subject,
        date,
        records,
        remarks
      };

      const res = await api.post('/faculty/attendance', payload);
      if (res.data?.success) {
        setSuccess('Attendance register saved successfully! Cumulative records updated.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <CalendarCheck className="h-6 w-6 text-indigo-600" />
          Class Attendance Register
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Mark daily classroom attendance session by session. Cumulative percentages update automatically.
        </p>
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

      {/* Filter and Class Selection Card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Class / Batch</label>
            <select
              value={`${selectedClass.course}|${selectedClass.semester}|${selectedClass.section}`}
              onChange={(e) => {
                const [c, s, sec] = e.target.value.split('|');
                const matched = classes.find(
                  (item) => item.course === c && item.semester === s && (item.section || 'A') === sec
                );
                setSelectedClass({
                  course: c,
                  branch: matched?.branch || '',
                  semester: s,
                  section: sec,
                  subject: matched?.subject || selectedClass.subject
                });
              }}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
            >
              {classes.map((c, idx) => (
                <option key={idx} value={`${c.course}|${c.semester}|${c.section || 'A'}`}>
                  {c.course} - Sem {c.semester} ({c.section || 'A'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Subject</label>
            <input
              type="text"
              value={selectedClass.subject}
              onChange={(e) => setSelectedClass({ ...selectedClass, subject: e.target.value })}
              placeholder="e.g. Data Structures"
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Session Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Topic or lab unit"
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={loadStudents}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
            >
              Reload Roster
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Sheet */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Enrolled: {students.length}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Present: {presentCount}
            </span>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Absent: {absentCount}
            </span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Late: {lateCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-sm"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold transition-all"
            >
              Clear All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No students found in this course and semester.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st, idx) => {
                    const currentStatus = attendanceMap[st._id] || 'PRESENT';
                    return (
                      <tr key={st._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {st.universityRollNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{st.fullName}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st._id, 'PRESENT')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st._id, 'ABSENT')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st._id, 'LATE')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === 'LATE'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Late
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="submit"
                disabled={saving || students.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Attendance...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save & Lock Attendance Register</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
