import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, FileText, ExternalLink, Download, Loader2, AlertCircle, User, Calendar } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const StudentMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/study-materials');
        if (res.data?.success) {
          setMaterials(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load study materials');
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const filtered = typeFilter === 'ALL'
    ? materials
    : materials.filter((m) => m.type === typeFilter);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          Study Material & Assignments Desk
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Official lecture notes, lab manuals, and assignments uploaded by your course faculty.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'NOTES', 'ASSIGNMENT', 'SYLLABUS'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              typeFilter === t
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t === 'ALL' ? 'All Resources' : t}
          </button>
        ))}
      </div>

      {/* Grid of Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No resources available in this category</p>
          </div>
        ) : (
          filtered.map((item) => (
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
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">{item.subject}</p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {item.description || 'No additional instructions provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    {item.facultyId?.name || 'Department Faculty'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.attachment && (
                    <a
                      href={item.attachment}
                      download={item.attachmentName || 'notes.pdf'}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Resource</span>
                    </a>
                  )}

                  {item.externalLink && (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Open Link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
