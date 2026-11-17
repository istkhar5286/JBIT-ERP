import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart3,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Download,
  Filter,
  Layers,
  PieChart
} from 'lucide-react';

export const WardenReports = () => {
  const [reportData, setReportData] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const url = selectedHostel !== 'ALL'
        ? `/warden/reports/occupancy?hostelId=${selectedHostel}`
        : '/warden/reports/occupancy';

      const [repRes, hRes] = await Promise.all([
        api.get(url),
        api.get('/warden/hostels')
      ]);

      if (repRes.data?.success) {
        setReportData(repRes.data.data);
      }
      if (hRes.data?.success) {
        setHostels(hRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compile occupancy report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedHostel]);

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || {
    totalCapacity: 0,
    occupied: 0,
    available: 0,
    reserved: 0,
    maintenance: 0,
    occupancyRate: 0
  };

  const roomBreakdown = reportData?.roomBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold tracking-wider uppercase mb-1">
            <BarChart3 className="w-4 h-4" /> Analytics & Audits
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Hostel Occupancy & Capacity Report</h1>
          <p className="text-slate-300 text-sm mt-1">
            Comprehensive breakdown of building capacity, block-wise utilization, and room-level student allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedHostel}
            onChange={(e) => setSelectedHostel(e.target.value)}
            className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium text-white focus:outline-none backdrop-blur-sm"
          >
            <option value="ALL" className="text-slate-900">All Campus Hostels</option>
            {hostels.map(h => (
              <option key={h._id} value={h._id} className="text-slate-900">{h.hostelName}</option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2 text-sm"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
          <p className="text-sm font-medium">Generating occupancy analytics...</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Capacity</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary.totalCapacity}</p>
              <span className="text-[11px] text-slate-400">Registered Beds</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm">
              <p className="text-xs font-bold text-rose-600 uppercase">Occupied Beds</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{summary.occupied}</p>
              <span className="text-[11px] text-rose-500/80">Active Residents</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase">Available Beds</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{summary.available}</p>
              <span className="text-[11px] text-emerald-500/80">Ready for Admission</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm">
              <p className="text-xs font-bold text-amber-600 uppercase">Maintenance / Reserved</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{summary.maintenance + summary.reserved}</p>
              <span className="text-[11px] text-amber-500/80">{summary.maintenance} Repair, {summary.reserved} Hold</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm col-span-2 lg:col-span-1">
              <p className="text-xs font-bold text-indigo-600 uppercase">Occupancy Rate</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{summary.occupancyRate}%</p>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(summary.occupancyRate, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Room-by-Room Breakdown Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Room-wise Occupancy Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">List of rooms, bed allocation statuses, and occupant names.</p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {roomBreakdown.length} Rooms Tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    <th className="p-4">Room Location</th>
                    <th className="p-4">Type & Capacity</th>
                    <th className="p-4">Occupancy Status</th>
                    <th className="p-4">Beds & Current Residents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                  {roomBreakdown.map((room, idx) => {
                    const isFull = room.availableBeds === 0 && room.occupiedBeds > 0;
                    const isVacant = room.occupiedBeds === 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            Room {room.roomNumber}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {room.hostelName} · {room.block}, {room.floor}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {room.roomType}
                          </div>
                          <div className="text-xs text-slate-500">
                            Capacity: {room.totalBeds} bed(s)
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                isFull
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  : isVacant
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {isFull ? 'Fully Occupied' : isVacant ? 'Completely Vacant' : 'Partially Occupied'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {room.occupiedBeds} occupied / {room.availableBeds} available
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {room.beds.map((b) => (
                              <div
                                key={b._id}
                                className={`px-2.5 py-1.5 rounded-xl text-xs border ${
                                  b.status === 'OCCUPIED'
                                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                                    : b.status === 'AVAILABLE'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                                }`}
                              >
                                <span className="font-bold">{b.bedNumber}:</span>{' '}
                                {b.status === 'OCCUPIED' && b.occupantStudentId ? (
                                  <span>{b.occupantStudentId.fullName} ({b.occupantStudentId.universityRollNumber || 'Roll'})</span>
                                ) : (
                                  <span className="font-semibold uppercase text-[10px]">{b.status}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default WardenReports;
