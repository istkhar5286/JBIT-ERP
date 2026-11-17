import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, GraduationCap, ArrowRight, Loader2, AlertCircle, Phone, Mail, Search, BookOpen } from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const FacultyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/faculty/classes');
        if (res.data?.success) {
          const list = res.data.data || [];
          setClasses(list);
          if (list.length > 0) {
            handleSelectClass(list[0]);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assigned classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);
    setLoadingStudents(true);
    try {
      const res = await api.get('/faculty/students', {
        params: {
          course: cls.course,
          branch: cls.branch,
          semester: cls.semester,
          section: cls.section
        }
      });
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.universityRollNumber?.toLowerCase().includes(q) ||
      s.mobile?.includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users className="h-6 w-6 text-indigo-600" />
          Assigned Classes & Student Rosters
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your enrolled students, review attendance stats, and view contact profiles.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Class Selector Badges */}
      <div className="flex flex-wrap gap-2.5">
        {classes.length === 0 ? (
          <p className="text-xs text-slate-400">No classes assigned yet.</p>
        ) : (
          classes.map((cls, idx) => {
            const isSelected =
              selectedClass?.course === cls.course &&
              selectedClass?.semester === cls.semester &&
              selectedClass?.section === cls.section;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectClass(cls)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cls.course} - Sem {cls.semester} ({cls.section || 'A'})
              </button>
            );
          })
        )}
      </div>

      {/* Selected Class Details & Students Roster */}
      {selectedClass && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="text-base font-black text-slate-900">
                {selectedClass.course} &bull; Semester {selectedClass.semester} (Section {selectedClass.section || 'A'})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Enrolled Students: <span className="font-bold text-slate-800">{students.length}</span>
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, roll, mobile..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
              />
            </div>
          </div>

          {loadingStudents ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No students found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Father's Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        {st.profilePhoto ? (
                          <img
                            src={st.profilePhoto}
                            alt={st.fullName}
                            className="h-8 w-8 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs">
                            {st.fullName?.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {st.universityRollNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {st.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {st.fatherName || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {st.mobile}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {st.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {st.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
