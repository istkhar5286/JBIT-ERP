import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, FileText, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const StudentNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/notices');
        if (res.data?.success) {
          setNotices(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notices');
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const filtered = categoryFilter === 'ALL'
    ? notices
    : notices.filter((n) => n.category === categoryFilter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bell className="h-6 w-6 text-indigo-600" />
          Campus Notices & Announcements
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Official notifications from JB Institute of Technology Dean, Registrar, and Accounts office.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'ACADEMIC', 'EXAMINATION', 'FEES', 'EVENTS', 'HOLIDAYS', 'GENERAL'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No notices in this category</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-indigo-300 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    item.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.category}
                  </span>
                  {item.priority === 'HIGH' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                      IMPORTANT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <h2 className="text-base font-black text-slate-900">{item.title}</h2>
              <p className="text-xs text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                {item.description}
              </p>

              {item.attachment && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <a
                    href={item.attachment}
                    download={item.attachmentName || 'notice_document.pdf'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Download Official PDF ({item.attachmentName || 'Attachment'})</span>
                  </a>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Issued by: {item.postedBy?.name || 'Administration Office'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
