import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UploadCloud, FileText, Trash2, Plus, Loader2, AlertCircle, CheckCircle2, ExternalLink, BookOpen } from 'lucide-react';

export const FacultyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    subjectCode: '',
    course: 'B.Tech Computer Science & Engineering',
    semester: '1',
    type: 'NOTES', // 'NOTES' | 'ASSIGNMENT' | 'SYLLABUS'
    attachment: '',
    attachmentName: '',
    externalLink: ''
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/study-materials');
      if (res.data?.success) {
        setMaterials(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Attachment file size should be less than 8MB');
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/faculty/study-materials', form);
      if (res.data?.success) {
        setSuccess('Study material uploaded and shared with enrolled students!');
        setShowModal(false);
        setForm({
          title: '',
          description: '',
          subject: '',
          subjectCode: '',
          course: 'B.Tech Computer Science & Engineering',
          semester: '1',
          type: 'NOTES',
          attachment: '',
          attachmentName: '',
          externalLink: ''
        });
        fetchMaterials();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      const res = await api.delete(`/faculty/study-materials/${id}`);
      if (res.data?.success) {
        setMaterials((prev) => prev.filter((m) => m._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete material');
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
            <UploadCloud className="h-6 w-6 text-indigo-600" />
            Study Materials & Assignments Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload lecture notes, unit question banks, and assignments for your students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Upload New Material</span>
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

      {/* Uploaded List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No study materials uploaded yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Click 'Upload New Material' above to share your first document.</p>
          </div>
        ) : (
          materials.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    item.type === 'ASSIGNMENT' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Sem {item.semester}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">{item.subject}</p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.attachment && (
                    <a
                      href={item.attachment}
                      download={item.attachmentName || 'document.pdf'}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                  {item.externalLink && (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Link</span>
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item._id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete material"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900 mb-1">Upload Study Material / Assignment</h2>
            <p className="text-xs text-slate-500 mb-4">Material will be immediately accessible by enrolled students.</p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Unit 2: Binary Search Trees Lecture Notes"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summary of topics covered..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Data Structures"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="NOTES">Lecture Notes</option>
                    <option value="ASSIGNMENT">Assignment Task</option>
                    <option value="SYLLABUS">Syllabus / Lab Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Course</label>
                  <input
                    type="text"
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Semester</label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">File Attachment (PDF / Document)</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {form.attachmentName && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Attached: {form.attachmentName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Or External URL / Video Link</label>
                <input
                  type="url"
                  value={form.externalLink}
                  onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
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
                  <span>Upload & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
