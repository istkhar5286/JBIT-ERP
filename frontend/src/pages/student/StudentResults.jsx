import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, FileText, Download, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [expandedSemester, setExpandedSemester] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/results');
        if (res.data?.success) {
          const list = res.data.data || [];
          setResults(list);
          if (list.length > 0) {
            setExpandedSemester(list[list.length - 1]._id);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleDownloadMarksheet = async (semester) => {
    try {
      setDownloading(semester);
      const res = await api.get('/student/documents/marksheet', {
        params: { semester },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JBIT_Semester_${semester}_Marksheet.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download marksheet');
    } finally {
      setDownloading(null);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Award className="h-6 w-6 text-indigo-600" />
          Academic Results & Grade Sheets
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review semester-wise examination scores, SGPA/CGPA evaluation, and download official marksheets.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {results.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">No examination results published yet</p>
          <p className="text-xs text-slate-400 mt-0.5">Results will appear here once finalized by the Examination Department.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {results.map((res) => {
            const isExpanded = expandedSemester === res._id;
            const hasBacks = res.backPapers && res.backPapers.length > 0;

            return (
              <div
                key={res._id}
                className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Header Banner */}
                <div
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  onClick={() => setExpandedSemester(isExpanded ? null : res._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center">
                      Sem {res.semester}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-slate-900">
                          Semester {res.semester} Grade Sheet
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hasBacks ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {hasBacks ? 'Back Paper(s)' : 'Passed'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Academic Year: {res.academicYear} &bull; Total Credits: {res.totalCredits || 24}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold uppercase">Semester SGPA</p>
                      <p className="text-xl font-black text-indigo-600 font-mono">
                        {res.sgpa ? res.sgpa.toFixed(2) : '0.00'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadMarksheet(res.semester);
                      }}
                      disabled={downloading === res.semester}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all"
                    >
                      {downloading === res.semester ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>Marksheet PDF</span>
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Back paper banner */}
                {hasBacks && (
                  <div className="px-5 py-2.5 bg-amber-50 border-t border-b border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Back Papers pending clearance: {res.backPapers.join(', ')}</span>
                  </div>
                )}

                {/* Detailed Subject Marks Table */}
                {isExpanded && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Subject Code</th>
                          <th className="py-3 px-4">Subject Title</th>
                          <th className="py-3 px-3 text-center">Internal</th>
                          <th className="py-3 px-3 text-center">Sessional</th>
                          <th className="py-3 px-3 text-center">Practical</th>
                          <th className="py-3 px-3 text-center">External</th>
                          <th className="py-3 px-3 text-center">Total</th>
                          <th className="py-3 px-3 text-center">Grade</th>
                          <th className="py-3 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(res.marks || []).map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                              {m.subjectCode}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {m.subjectName}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 font-mono">
                              {m.internalMarks}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 font-mono">
                              {m.sessionalMarks}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 font-mono">
                              {m.practicalMarks}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 font-mono">
                              {m.externalMarks}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                              {m.totalMarks} / {m.maxMarks || 100}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-indigo-600 font-mono">
                              {m.grade}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.status === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
