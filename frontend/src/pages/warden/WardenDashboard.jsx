import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Home,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Receipt,
  MessageSquare,
  CalendarCheck,
  BarChart3,
  ArrowUpRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const WardenDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warden/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch warden dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  const { metrics, recentApplications = [], recentAllocations = [], recentPayments = [], recentComplaints = [], recentOutings = [] } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 to-teal-950 p-6 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Home className="h-4 w-4" />
            <span>Hostel Administration Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Warden Control Center</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time residential occupancy, live bed availability, student applications, and gate pass desk.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/warden/beds"
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20"
          >
            Manage Beds
          </Link>
          <Link
            to="/warden/applications"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
          >
            Applications ({metrics?.applications?.pending || 0})
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Hostel Buildings</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalHostels || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Active residential wings</span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Rooms</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalRooms || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Distinct rooms mapped</span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Capacity</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalBeds || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Beds in database</span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Available Beds</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{metrics?.availableBeds || 0}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Vacant for allocation</span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-700 uppercase">Occupied Beds</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{metrics?.occupiedBeds || 0}</p>
          <span className="text-[10px] text-indigo-600 font-semibold">Current student residents</span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-teal-200 bg-teal-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-teal-700 uppercase">Occupancy Rate</span>
          <p className="text-2xl font-black text-teal-700 mt-1">{metrics?.occupancyPercentage || 0}%</p>
          <span className="text-[10px] text-teal-600 font-semibold">Calculated from actual beds</span>
        </div>
      </div>

      {/* Secondary Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Applications</span>
            <p className="text-lg font-extrabold text-amber-600 mt-0.5">{metrics?.applications?.pending || 0}</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Allocated Students</span>
            <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{metrics?.applications?.approved || 0}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Hostel Grievances</span>
            <p className="text-lg font-extrabold text-rose-600 mt-0.5">{metrics?.openComplaints || 0} Open</p>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <MessageSquare className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Gate Passes</span>
            <p className="text-lg font-extrabold text-indigo-600 mt-0.5">{metrics?.pendingOutings || 0} Outings</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarCheck className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Progress & Quick Links Row */}
      <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Overall Campus Hostel Capacity Utilization</span>
          <span>{metrics?.occupiedBeds || 0} / {metrics?.totalBeds || 0} Beds Occupied ({metrics?.occupancyPercentage || 0}%)</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-teal-600 h-full transition-all duration-500"
            style={{ width: `${Math.min(metrics?.occupancyPercentage || 0, 100)}%` }}
          />
        </div>
      </div>

      {/* Tables: Recent Applications & Outing Passes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                <span>Recent Hostel Applications</span>
              </h2>
              <Link to="/warden/applications" className="text-xs font-bold text-teal-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent hostel applications found.</p>
            ) : (
              <div className="space-y-2.5">
                {recentApplications.map((app) => (
                  <div key={app._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{app.studentName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {app.studentRoll} &bull; {app.hostelName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(app.createdAt).toLocaleDateString('en-IN')} &bull; Fee: ₹{Number(app.feeAmount).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        app.status === 'ALLOCATED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'WAITLISTED'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Outing / Gate Pass Requests */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-teal-600" />
                <span>Pending Outing / Gate Passes</span>
              </h2>
              <Link to="/warden/outings" className="text-xs font-bold text-teal-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            {recentOutings.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No pending gate pass requests.</p>
            ) : (
              <div className="space-y-2.5">
                {recentOutings.map((out) => (
                  <div key={out._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{out.studentName} ({out.rollNumber})</p>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Reason: {out.reason}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Departure: {new Date(out.departureDate).toLocaleDateString('en-IN')} &bull; Return: {new Date(out.expectedReturnDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        out.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : out.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {out.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Open Grievances & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hostel Grievances */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-teal-600" />
              <span>Recent Hostel Complaints</span>
            </h2>
            <Link to="/warden/complaints" className="text-xs font-bold text-teal-600 hover:underline">
              Desk &rarr;
            </Link>
          </div>

          {recentComplaints.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No open student complaints.</p>
          ) : (
            <div className="space-y-2.5">
              {recentComplaints.map((c) => (
                <div key={c._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 mr-2">
                      {c.category}
                    </span>
                    <span className="font-bold text-slate-900">{c.subject}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Student: {c.studentName} &bull; Room {c.roomNumber || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Hostel Fee Payments */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-teal-600" />
              <span>Recent Hostel Fee Transactions</span>
            </h2>
            <Link to="/warden/payments" className="text-xs font-bold text-teal-600 hover:underline">
              Ledger &rarr;
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent payments recorded.</p>
          ) : (
            <div className="space-y-2.5">
              {recentPayments.map((p) => (
                <div key={p._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{p.studentId?.fullName || 'Student'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      RCP: {p.receiptNumber} &bull; TXN: {p.transactionId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 text-sm">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
