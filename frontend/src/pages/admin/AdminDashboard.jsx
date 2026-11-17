import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BadgeDollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Receipt,
  Download,
  BarChart3,
  PieChart,
  ShieldAlert,
  Wallet,
  Coins,
  ChevronRight,
  ExternalLink,
  Tag,
  RotateCcw,
  Calendar,
  Send,
  Search
} from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fee Status Overview Interactive List state (Requirement 16: CLEAR, PENDING, OVERDUE)
  const [activeFeeTab, setActiveFeeTab] = useState('PENDING'); // 'CLEAR' | 'PENDING' | 'OVERDUE'
  const [feeStudents, setFeeStudents] = useState([]);
  const [loadingFeeStudents, setLoadingFeeStudents] = useState(false);
  const [feeSearch, setFeeSearch] = useState('');
  const [sendingReminder, setSendingReminder] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeStudents = async (statusTab) => {
    try {
      setLoadingFeeStudents(true);
      const res = await api.get('/admin/fees-by-status', {
        params: { status: statusTab }
      });
      if (res.data?.success) {
        setFeeStudents(res.data.data.students || []);
      }
    } catch (err) {
      console.error('Failed to load fee categorized students:', err);
    } finally {
      setLoadingFeeStudents(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchFeeStudents(activeFeeTab);
  }, [activeFeeTab]);

  const handleSendReminder = async (studentId, type = 'UPCOMING') => {
    try {
      setSendingReminder(studentId);
      const res = await api.post('/admin/fees/reminders/send', {
        studentId,
        reminderType: type
      });
      if (res.data?.success) {
        alert('Fee reminder notice sent successfully to registered student email!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send fee reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={1} height="h-28" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <LoadingSkeleton count={6} height="h-28" />
        </div>
        <LoadingSkeleton count={2} height="h-72" />
      </div>
    );
  }

  const { cards = {}, charts = { monthlyTrends: [], paymentDistribution: [] }, recentPayments = [] } = data || {};

  const filteredFeeStudents = feeStudents.filter(
    (st) =>
      st.fullName?.toLowerCase().includes(feeSearch.toLowerCase()) ||
      st.universityRollNumber?.toLowerCase().includes(feeSearch.toLowerCase()) ||
      st.email?.toLowerCase().includes(feeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={BRANDING.LOGO}
            alt={BRANDING.LOGO_ALT}
            className="h-16 w-16 object-contain rounded-2xl bg-white/10 p-1.5 border border-white/20 shrink-0 hidden sm:block shadow-lg"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 mb-2">
              <BarChart3 className="h-3.5 w-3.5" />
              {BRANDING.INSTITUTE_NAME} &bull; Administration Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Administrative & Fee Management Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {BRANDING.ADDRESS}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => navigate('/admin/students')}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
          >
            Manage Students
          </button>
          <button
            onClick={() => navigate('/admin/fees')}
            className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all border border-white/20"
          >
            Fee Structures
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all border border-white/20"
          >
            Export Reports
          </button>
        </div>
      </div>

      {/* SECTION 1: ALL 11 CORE METRICS (Requirement 16) */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Coins className="h-4 w-4 text-indigo-600" />
          Institutional Financial & Enrollment Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Total Students */}
          <StatCard
            title="Total Students"
            value={cards.totalStudents || 0}
            subtitle={`${cards.activeStudents || 0} enrolled active`}
            icon={Users}
            color="indigo"
          />

          {/* 2. Fees Clear */}
          <StatCard
            title="Fees Clear"
            value={cards.clearStudentsCount || 0}
            subtitle="100% paid up"
            icon={CheckCircle2}
            color="emerald"
          />

          {/* 3. Fees Pending */}
          <StatCard
            title="Fees Pending"
            value={cards.pendingStudentsCount || 0}
            subtitle="Outstanding balances"
            icon={AlertCircle}
            color="amber"
          />

          {/* 4. Overdue Students */}
          <StatCard
            title="Overdue Students"
            value={cards.overdueStudentsCount || 0}
            subtitle="Past installment due date"
            icon={AlertTriangle}
            color="rose"
          />

          {/* 5. Total Fees */}
          <StatCard
            title="Total Fees"
            value={formatCurrency(cards.totalFees || 0)}
            subtitle="Assessed semester fees"
            icon={CreditCard}
            color="indigo"
          />

          {/* 6. Total Collected */}
          <StatCard
            title="Total Collected"
            value={formatCurrency(cards.totalCollected || 0)}
            subtitle="Gross receipts"
            icon={Wallet}
            color="emerald"
          />
        </div>

        {/* Secondary Row of Core Financial Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 pt-1">
          {/* 7. Total Pending */}
          <StatCard
            title="Total Pending"
            value={formatCurrency(cards.totalPending || cards.totalPendingFees || 0)}
            subtitle="Dues to collect"
            icon={AlertTriangle}
            color="rose"
          />

          {/* 8. Today's Collection */}
          <StatCard
            title="Today's Collection"
            value={formatCurrency(cards.todayCollection || 0)}
            subtitle="Receipts cleared today"
            icon={Clock}
            color="sky"
          />

          {/* 9. Monthly Collection */}
          <StatCard
            title="Monthly Collection"
            value={formatCurrency(cards.monthlyCollection || 0)}
            subtitle="Collections this month"
            icon={Calendar}
            color="emerald"
          />

          {/* 10. Total Scholarships / Discounts */}
          <StatCard
            title="Total Scholarships"
            value={formatCurrency(cards.totalScholarships || 0)}
            subtitle="Waivers & discounts"
            icon={Tag}
            color="amber"
          />

          {/* 11. Total Refunds */}
          <StatCard
            title="Total Refunds"
            value={formatCurrency(cards.totalRefunds || 0)}
            subtitle="Approved refunds"
            icon={RotateCcw}
            color={cards.totalRefunds > 0 ? "amber" : "indigo"}
          />
        </div>
      </div>

      {/* SECTION 2: CATEGORIZED LISTS (CLEAR, PENDING, OVERDUE) (Requirement 16) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          {/* Separate List Tabs: CLEAR FEES, PENDING FEES, OVERDUE FEES */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFeeTab('PENDING')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeFeeTab === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <span>PENDING FEES ({cards.pendingStudentsCount || 0})</span>
            </button>

            <button
              onClick={() => setActiveFeeTab('CLEAR')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeFeeTab === 'CLEAR'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>CLEAR FEES ({cards.clearStudentsCount || 0})</span>
            </button>

            <button
              onClick={() => setActiveFeeTab('OVERDUE')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeFeeTab === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>OVERDUE FEES ({cards.overdueStudentsCount || 0})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={feeSearch}
              onChange={(e) => setFeeSearch(e.target.value)}
              placeholder="Filter by name or roll no..."
              className="w-full rounded-xl border border-slate-300 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Categorized Student Table */}
        <div className="overflow-x-auto">
          {loadingFeeStudents ? (
            <div className="py-8">
              <LoadingSkeleton count={3} height="h-12" />
            </div>
          ) : filteredFeeStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No students found in the <strong className="text-slate-600">{activeFeeTab}</strong> category.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">Student Particulars</th>
                  <th className="px-3.5 py-3">Course & Semester</th>
                  <th className="px-3.5 py-3">Total Payable</th>
                  <th className="px-3.5 py-3">Paid Amount</th>
                  <th className="px-3.5 py-3">Pending Balance</th>
                  <th className="px-3.5 py-3">Fee Status</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFeeStudents.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3">
                      <p className="font-extrabold text-slate-900">{st.fullName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{st.universityRollNumber} &bull; {st.email}</p>
                    </td>
                    <td className="px-3.5 py-3 text-slate-600">
                      <p className="font-semibold text-slate-800">{st.course}</p>
                      <p className="text-[11px] text-slate-500">Sem {st.semester}</p>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">
                      {formatCurrency(st.totalPayable)}
                    </td>
                    <td className="px-3.5 py-3 font-extrabold text-emerald-700">
                      {formatCurrency(st.paidAmount)}
                    </td>
                    <td className="px-3.5 py-3 font-bold">
                      <span className={st.pendingAmount === 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {formatCurrency(st.pendingAmount)}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          st.status === 'CLEAR'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : st.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/admin/students/${st._id}`)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 transition-colors"
                      >
                        <span>Details</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>

                      {st.pendingAmount > 0 && (
                        <button
                          disabled={sendingReminder === st._id}
                          onClick={() => handleSendReminder(st._id, activeFeeTab === 'OVERDUE' ? 'OVERDUE' : 'UPCOMING')}
                          title="Send Fee Reminder Email"
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 transition-colors"
                        >
                          <Send className="h-3 w-3" />
                          <span>Remind</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 3: RECENT TRANSACTIONS */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Recent Fee Transactions
          </h3>
          <button
            onClick={() => navigate('/admin/payments')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
          >
            View Full Payment Ledger &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No transactions recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-3.5 py-3">Receipt No</th>
                  <th className="px-3.5 py-3">Student Name</th>
                  <th className="px-3.5 py-3">Amount</th>
                  <th className="px-3.5 py-3">Payment Method</th>
                  <th className="px-3.5 py-3">Date</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="px-3.5 py-3 font-medium text-slate-900">{p.studentId?.fullName || 'Student'}</td>
                    <td className="px-3.5 py-3 font-extrabold text-slate-900">{formatCurrency(p.amount)}</td>
                    <td className="px-3.5 py-3 font-semibold text-indigo-700">{p.paymentMethod}</td>
                    <td className="px-3.5 py-3 text-slate-500">{new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-3.5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-3.5 py-3 text-right">
                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs font-bold text-slate-700"
                        >
                          <Receipt className="h-3 w-3" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 4: ACADEMIC & INSTITUTIONAL OPERATIONS SNAPSHOT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Exams Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span>Upcoming Exams ({cards.upcomingExamsCount || 0})</span>
              </h4>
              <button
                onClick={() => navigate('/admin/exams')}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Manage &rarr;
              </button>
            </div>
            {(data?.upcomingExams || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming examinations scheduled.</p>
            ) : (
              <div className="space-y-2">
                {(data?.upcomingExams || []).slice(0, 3).map((ex) => (
                  <div key={ex._id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-bold text-slate-900">{ex.subject}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(ex.examDate).toLocaleDateString('en-IN')} &bull; {ex.startTime} &bull; {ex.room || 'Main Hall'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Grievances Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Pending Complaints ({cards.pendingComplaintsCount || 0})</span>
              </h4>
              <button
                onClick={() => navigate('/admin/complaints')}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Review &rarr;
              </button>
            </div>
            {(data?.pendingComplaints || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All grievance tickets are resolved.</p>
            ) : (
              <div className="space-y-2">
                {(data?.pendingComplaints || []).slice(0, 3).map((c) => (
                  <div key={c._id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{c.subject}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                        {c.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      From: {c.studentName} ({new Date(c.createdAt).toLocaleDateString('en-IN')})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Notices Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-600" />
                <span>Recent Notices ({cards.recentNoticesCount || 0})</span>
              </h4>
              <button
                onClick={() => navigate('/admin/notices')}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Publisher &rarr;
              </button>
            </div>
            {(data?.recentNotices || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No notices published recently.</p>
            ) : (
              <div className="space-y-2">
                {(data?.recentNotices || []).slice(0, 3).map((n) => (
                  <div key={n._id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-bold text-slate-900 line-clamp-1">{n.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(n.date).toLocaleDateString('en-IN')} &bull; Target: {n.targetAudience}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for viewing receipt */}

      {selectedPayment && (
        <ReceiptModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
          student={selectedPayment.studentId}
        />
      )}
    </div>
  );
};
