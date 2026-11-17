import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, MapPin, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { BRANDING } from '../../config/branding';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FacultyTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(
    DAYS[new Date().getDay() - 1] || 'Monday'
  );

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const res = await api.get('/faculty/timetable');
        if (res.data?.success) {
          setTimetable(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch timetable');
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const daySlots = timetable.filter((t) => t.day === activeDay);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Calendar className="h-6 w-6 text-indigo-600" />
          Faculty Teaching Schedule
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Weekly lecture allotments, laboratory sessions, and assigned room venues.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Day Tabs */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const isCurrent = d === activeDay;
          const count = timetable.filter((t) => t.day === d).length;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDay(d)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{d}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isCurrent ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="text-base font-black text-slate-900 mb-4 flex items-center justify-between">
          <span>Lectures on {activeDay}</span>
          <span className="text-xs font-bold text-slate-400">{daySlots.length} lecture slots</span>
        </h2>

        {daySlots.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No lectures scheduled on {activeDay}</p>
            <p className="text-xs text-slate-400 mt-0.5">Free period for academic mentorship and research</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daySlots.map((slot) => (
              <div
                key={slot._id}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all bg-slate-50/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
                    <Clock className="h-3 w-3" />
                    {slot.timeSlot}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <MapPin className="h-3 w-3 text-amber-500" />
                    {slot.room || 'LH-101'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{slot.subject}</h3>
                {slot.subjectCode && (
                  <p className="text-[10px] font-mono text-indigo-600 font-semibold uppercase">{slot.subjectCode}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  {slot.course} &bull; Sem {slot.semester} (Sec {slot.section || 'A'})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
