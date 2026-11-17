import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, Save, Loader2, AlertCircle, CheckCircle2, Search, BookOpen, GraduationCap } from 'lucide-react';

export const FacultyMarks = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState({
    course: '',
    branch: '',
    semester: '1',
    section: 'A',
    subject: '',
    subjectCode: ''
  });
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({}); // studentId -> { internal, sessional, practical, external }
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
            subject: first.subject || '',
            subjectCode: first.subjectCode || 'CS-301'
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

        const initialMap = {};
        list.forEach((st) => {
          initialMap[st._id] = {
            internal: 20,
            sessional: 20,
            practical: 15,
            external: 35
          };
        });
        setMarksData(initialMap);
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

  const handleMarkChange = (studentId, field, val) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: Number(val)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass.subject) {
      setError('Please provide subject name and code');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const studentsPayload = students.map((st) => {
        const m = marksData[st._id] || { internal: 0, sessional: 0, practical: 0, external: 0 };
        return {
          studentId: st._id,
          internalMarks: m.internal,
          sessionalMarks: m.sessional,
          practicalMarks: m.practical,
          externalMarks: m.external,
          maxMarks: 100,
          credits: 4
        };
      });

      const payload = {
        semester: selectedClass.semester,
        academicYear: '2024-2025',
        subject: selectedClass.subject,
        subjectCode: selectedClass.subjectCode || 'SUB-101',
        students: studentsPayload
      };

      const res = await api.post('/faculty/marks', payload);
      if (res.data?.success) {
        setSuccess('Marks and examination evaluation submitted successfully! Semester SGPA recalculated.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Award className="h-6 w-6 text-indigo-600" />
          Marks & Evaluation Entry
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Record internal, sessional, practical, and end-term marks. Grade points and back papers calculate automatically.
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

      {/* Class and Subject Selection Bar */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  subject: matched?.subject || selectedClass.subject,
                  subjectCode: matched?.subjectCode || selectedClass.subjectCode
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
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Subject Name</label>
            <input
              type="text"
              value={selectedClass.subject}
              onChange={(e) => setSelectedClass({ ...selectedClass, subject: e.target.value })}
              placeholder="e.g. Operating Systems"
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Subject Code</label>
            <input
              type="text"
              value={selectedClass.subjectCode}
              onChange={(e) => setSelectedClass({ ...selectedClass, subjectCode: e.target.value.toUpperCase() })}
              placeholder="e.g. BCS-501"
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 bg-white uppercase font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={loadStudents}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
            >
              Refresh Student List
            </button>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
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
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-3 text-center">Internal (25)</th>
                    <th className="py-3 px-3 text-center">Sessional (25)</th>
                    <th className="py-3 px-3 text-center">Practical (20)</th>
                    <th className="py-3 px-3 text-center">External (30)</th>
                    <th className="py-3 px-3 text-center">Total (100)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => {
                    const m = marksData[st._id] || { internal: 0, sessional: 0, practical: 0, external: 0 };
                    const total = Number(m.internal || 0) + Number(m.sessional || 0) + Number(m.practical || 0) + Number(m.external || 0);
                    const isPass = total >= 40;

                    return (
                      <tr key={st._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {st.universityRollNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{st.fullName}</td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="25"
                            value={m.internal}
                            onChange={(e) => handleMarkChange(st._id, 'internal', e.target.value)}
                            className="w-16 text-center rounded-lg border border-slate-300 py-1 text-xs focus:ring-1 focus:ring-indigo-600"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="25"
                            value={m.sessional}
                            onChange={(e) => handleMarkChange(st._id, 'sessional', e.target.value)}
                            className="w-16 text-center rounded-lg border border-slate-300 py-1 text-xs focus:ring-1 focus:ring-indigo-600"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={m.practical}
                            onChange={(e) => handleMarkChange(st._id, 'practical', e.target.value)}
                            className="w-16 text-center rounded-lg border border-slate-300 py-1 text-xs focus:ring-1 focus:ring-indigo-600"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={m.external}
                            onChange={(e) => handleMarkChange(st._id, 'external', e.target.value)}
                            className="w-16 text-center rounded-lg border border-slate-300 py-1 text-xs focus:ring-1 focus:ring-indigo-600"
                          />
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {total} / 100
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isPass ? 'PASS' : 'FAIL (BACK)'}
                          </span>
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
                    <span>Publishing Marks...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Submit & Publish Marks to Examination Ledger</span>
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
