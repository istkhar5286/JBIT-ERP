import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { CalendarCheck, AlertCircle, CheckCircle2, BookOpen, Clock } from 'lucide-react';

export const Attendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/attendance');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={1} height="h-36" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton count={6} height="h-40" />
        </div>
      </div>
    );
  }

  const { overallPercentage = 0, totalClasses = 0, attendedClasses = 0, absentClasses = 0, subjects = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-soft border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
            <CalendarCheck className="h-3.5 w-3.5" />
            University Attendance System
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Course Attendance Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Minimum 75% aggregate attendance is mandatory for semester end examination clearance.
          </p>
        </div>

        {/* Big Percentage Gauge */}
        <div className="flex items-center gap-6 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Attendance</p>
            <p className={`text-3xl sm:text-4xl font-black ${overallPercentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {overallPercentage}%
            </p>
            <p className="text-[11px] text-slate-400">
              {attendedClasses} / {totalClasses} Classes Attended
            </p>
          </div>
          <div className="h-16 w-1 bg-slate-200 rounded-full" />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">Attended: {attendedClasses}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-semibold text-slate-700">Absent: {absentClasses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Cards Grid */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Subject-wise Academic Performance</h3>
        {subjects.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center text-xs text-slate-400 border border-slate-100">
            No subject attendance records found for your current semester.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub._id}
                className="rounded-2xl bg-white p-5 shadow-soft border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{sub.subject}</h4>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-baseline text-xs mb-1.5">
                      <span className="font-semibold text-slate-500">Percentage</span>
                      <span className={`text-base font-black ${sub.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {sub.percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Class Counts */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total</p>
                    <p className="font-bold text-slate-800">{sub.totalClasses}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase">Attended</p>
                    <p className="font-extrabold text-emerald-700">{sub.attendedClasses}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-rose-600 font-semibold uppercase">Absent</p>
                    <p className="font-bold text-rose-700">{sub.absentClasses}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
