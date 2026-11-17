import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/faculty/dashboard');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load faculty dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm">
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
        <span>{error}</span>
      </div>
    );
  }

  const faculty = data?.faculty || user;
  const metrics = data?.metrics || { assignedClassesCount: 0, totalSubjects: 0, totalLectureSlots: 0, uploadedMaterialsCount: 0 };
  const todayClasses = data?.todayClasses || [];
  const assignedClasses = data?.assignedClasses || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {faculty?.profilePhoto ? (
              <img
                src={faculty.profilePhoto}
                alt={faculty.name}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-indigo-400/40 p-0.5 bg-slate-800"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-indigo-600/30 ring-2 ring-indigo-400/40 flex items-center justify-center font-black text-2xl text-indigo-300">
                {(faculty?.name || 'F').charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Welcome, Prof. {faculty?.name}
                </h1>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {faculty?.designation || 'Faculty Member'} &bull; Department of {faculty?.department || 'Engineering'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Employee ID: <span className="font-mono font-bold text-amber-300">{faculty?.employeeId}</span> &bull; {BRANDING.COLLEGE_NAME}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/faculty/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Mark Attendance</span>
            </Link>
            <Link
              to="/faculty/marks"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all"
            >
              <Award className="h-4 w-4" />
              <span>Enter Marks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Classes</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.assignedClassesCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Batches & Sections allotted</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teaching Subjects</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.totalSubjects}</p>
          <p className="mt-1 text-[11px] text-slate-400">Theory & Lab courses</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Lectures</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.totalLectureSlots}</p>
          <p className="mt-1 text-[11px] text-slate-400">Slots across weekly timetable</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Study Uploads</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.uploadedMaterialsCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Notes & Assignment papers</p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-black text-slate-900">Today's Class Schedule</h2>
            </div>
            <Link to="/faculty/timetable" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <span>Full Timetable</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {todayClasses.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No scheduled classes today</p>
              <p className="text-xs text-slate-400 mt-0.5">Enjoy your preparation and research time!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((cls) => (
                <div
                  key={cls._id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{cls.subject}</p>
                      <p className="text-xs text-slate-500">
                        {cls.course} &bull; Sem {cls.semester} ({cls.section || 'A'}) &bull; Room {cls.room || 'LH-101'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700">
                      {cls.timeSlot}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Classes Quick Actions */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-black text-slate-900">My Classes & Batches</h2>
            </div>

            <div className="space-y-2.5">
              {assignedClasses.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No assigned classes found.</p>
              ) : (
                assignedClasses.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.course}</p>
                      <p className="text-[11px] text-slate-500">
                        Sem {item.semester} {item.branch ? `(${item.branch})` : ''} - Sec {item.section || 'A'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {item.subject || 'Allotted'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <Link
              to="/faculty/attendance"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Mark Session Register</span>
            </Link>
            <Link
              to="/faculty/materials"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <BookOpen className="h-4 w-4" />
              <span>Upload Lecture Material</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Row: Teaching Subjects & Campus Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teaching Subjects */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-black text-slate-900">Teaching Subjects Allotted</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              {(data?.subjects || faculty?.subjects || []).length} Courses
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(data?.subjects || faculty?.subjects || faculty?.assignedSubjects || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No teaching subjects assigned yet by administration.</p>
            ) : (
              (data?.subjects || faculty?.subjects || faculty?.assignedSubjects || []).map((subj, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  <span className="text-xs font-bold text-slate-800">{subj}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Campus Notices */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-black text-slate-900">Recent Notices & Announcements</h2>
            </div>
            <Link
              to="/faculty/notices"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {(data?.notices || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active campus circulars at this moment.</p>
            ) : (
              (data?.notices || []).slice(0, 3).map((notice) => (
                <div
                  key={notice._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{notice.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{notice.description || notice.content}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    {notice.date ? new Date(notice.date).toLocaleDateString('en-IN') : 'Recent'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
