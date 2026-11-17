import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Layers, BookOpen, Plus, Edit2, Trash2, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdminCourses = () => {
  const [activeTab, setActiveTab] = useState('COURSES'); // 'COURSES' | 'SUBJECTS'
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    name: '',
    durationYears: 4,
    totalSemesters: 8,
    department: 'Engineering'
  });

  // Subject Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    subjectCode: '',
    name: '',
    course: 'B.Tech Computer Science & Engineering',
    branch: 'CSE',
    semester: '1',
    credits: 4,
    type: 'THEORY'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([
        api.get('/admin/courses'),
        api.get('/admin/subjects')
      ]);
      if (cRes.data?.success) setCourses(cRes.data.data || []);
      if (sRes.data?.success) setSubjects(sRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load academic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingCourseId) {
        const res = await api.put(`/admin/courses/${editingCourseId}`, courseForm);
        if (res.data?.success) {
          setSuccess('Course updated successfully');
          setShowCourseModal(false);
          fetchData();
        }
      } else {
        const res = await api.post('/admin/courses', courseForm);
        if (res.data?.success) {
          setSuccess('New degree course registered');
          setShowCourseModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Course operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course? All associated subject schedules will be impacted.')) return;
    try {
      const res = await api.delete(`/admin/courses/${id}`);
      if (res.data?.success) {
        setCourses((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingSubjectId) {
        const res = await api.put(`/admin/subjects/${editingSubjectId}`, subjectForm);
        if (res.data?.success) {
          setSuccess('Subject updated successfully');
          setShowSubjectModal(false);
          fetchData();
        }
      } else {
        const res = await api.post('/admin/subjects', subjectForm);
        if (res.data?.success) {
          setSuccess('New subject added to curriculum');
          setShowSubjectModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Subject operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject from curriculum?')) return;
    try {
      const res = await api.delete(`/admin/subjects/${id}`);
      if (res.data?.success) {
        setSubjects((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-indigo-600" />
            Curriculum, Courses & Subjects
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage institutional degree programs, semesters, branches, and subject credits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'COURSES' ? (
            <button
              type="button"
              onClick={() => {
                setEditingCourseId(null);
                setCourseForm({ courseCode: '', name: '', durationYears: 4, totalSemesters: 8, department: 'Engineering' });
                setShowCourseModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Degree Course</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingSubjectId(null);
                setSubjectForm({ subjectCode: '', name: '', course: courses[0]?.name || 'B.Tech Computer Science & Engineering', branch: 'CSE', semester: '1', credits: 4, type: 'THEORY' });
                setShowSubjectModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Subject</span>
            </button>
          )}
        </div>
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

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('COURSES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COURSES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Degree Courses ({courses.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SUBJECTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SUBJECTS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Subjects Catalog ({subjects.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'COURSES' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No degree courses found. Click 'Add Degree Course' above.
            </div>
          ) : (
            courses.map((c) => (
              <div
                key={c._id}
                className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                      {c.courseCode}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {c.durationYears} Years ({c.totalSemesters} Sem)
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Department: {c.department}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourseId(c._id);
                      setCourseForm({
                        courseCode: c.courseCode,
                        name: c.name,
                        durationYears: c.durationYears,
                        totalSemesters: c.totalSemesters,
                        department: c.department
                      });
                      setShowCourseModal(true);
                    }}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(c._id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Course & Branch</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {s.subjectCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.course} {s.branch ? `(${s.branch})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">Sem {s.semester}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{s.credits}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.type === 'LAB' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubjectId(s._id);
                            setSubjectForm({
                              subjectCode: s.subjectCode,
                              name: s.name,
                              course: s.course,
                              branch: s.branch,
                              semester: s.semester,
                              credits: s.credits,
                              type: s.type
                            });
                            setShowSubjectModal(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(s._id)}
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
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">
              {editingCourseId ? 'Edit Degree Course' : 'Register Degree Course'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">Degree program configuration at JBIT.</p>

            <form onSubmit={handleSaveCourse} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  value={courseForm.courseCode}
                  onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. BTECH-CSE"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Course Full Name</label>
                <input
                  type="text"
                  required
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={courseForm.durationYears}
                    onChange={(e) => setCourseForm({ ...courseForm, durationYears: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={courseForm.totalSemesters}
                    onChange={(e) => setCourseForm({ ...courseForm, totalSemesters: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Department</label>
                <input
                  type="text"
                  value={courseForm.department}
                  onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
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
                  <span>Save Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">
              {editingSubjectId ? 'Edit Curriculum Subject' : 'Add Subject to Curriculum'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">Configure subject code, semester, and credits.</p>

            <form onSubmit={handleSaveSubject} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.subjectCode}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. BCS-501"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Database Management Systems"
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Course Program</label>
                <input
                  type="text"
                  required
                  value={subjectForm.course}
                  onChange={(e) => setSubjectForm({ ...subjectForm, course: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Semester</label>
                  <select
                    value={subjectForm.semester}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="THEORY">Theory</option>
                    <option value="LAB">Practical / Lab</option>
                    <option value="PROJECT">Project / Seminar</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
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
                  <span>Save Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
