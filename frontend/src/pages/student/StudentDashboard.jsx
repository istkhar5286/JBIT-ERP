import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatCard } from '../../components/common/StatCard';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { AdmitCardModal } from '../../components/common/AdmitCardModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BadgeDollarSign,
  Receipt,
  CalendarCheck,
  TrendingUp,
  Download,
  ArrowRight,
  Sparkles,
  Lock,
  Award,
  FileCheck,
  ShieldCheck,
  Tag,
  Eye
} from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);
  const [downloadingDoc, setDownloadingDoc] = useState(null);
  const [showAdmitCardModal, setShowAdmitCardModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Could not load dashboard information. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDownloadDoc = async (docType, endpoint, filename) => {
    try {
      setDownloadingDoc(docType);
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed. Please check fee clearance status.');
    } finally {
      setDownloadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={1} height="h-28" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <LoadingSkeleton count={6} height="h-28" />
        </div>
        <LoadingSkeleton count={2} height="h-64" />
      </div>
    );
  }

  const { metrics = {}, documentEligibility = {}, installments = [], waivers = [], latestReceipt, recentPayments = [], recentFines = [], attendanceSummary = { subjects: [] } } = data || {};

  const isClear = metrics.feeStatus === 'CLEAR' || Number(metrics.pendingFee || 0) <= 0;
  const pendingAmt = Number(metrics.pendingFee || 0);
  const canAdmitCard = documentEligibility?.canDownloadAdmitCard || isClear;
  const canClearance = documentEligibility?.canDownloadClearance || isClear;
  const canNoDues = documentEligibility?.canDownloadNoDues;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Student Welcome & Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={BRANDING.LOGO}
              alt={BRANDING.LOGO_ALT}
              className="h-16 w-16 object-contain rounded-2xl bg-white/10 p-1.5 border border-white/20 shrink-0 hidden sm:block shadow-lg"
            />
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                {BRANDING.INSTITUTE_NAME} &bull; Student Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Welcome back, {user?.fullName}!
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200">
                Father's Name: <span className="font-semibold text-white">{user?.fatherName}</span> &bull; Roll No:{' '}
                <span className="font-mono font-semibold text-white">{user?.universityRollNumber}</span> &bull; {user?.course} (Sem {user?.semester})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/pay-fees')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95"
            >
              <BadgeDollarSign className="h-4 w-4" />
              Pay Fees
            </button>

            <Link
              to="/documents"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-3 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition-all border border-white/20"
            >
              <Award className="h-4 w-4 text-amber-300" />
              Admit Card & Docs
            </Link>
          </div>
        </div>

        {/* Decorative Background Blob */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Dynamic Fee Status & Gating Alert Banner */}
      {isClear ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase px-2.5 py-0.5 border border-emerald-300">
                  Fee Status: CLEAR
                </span>
                <span className="text-xs font-semibold text-emerald-800">100% Fees Settled</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">All Academic & College Fees Cleared</h3>
              <p className="text-xs text-slate-600">
                You have ₹0 pending fee balance. Examination Admit Card & Fee Clearance Certificate are unlocked.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleDownloadDoc('ADMIT_CARD', '/student/documents/admit-card', 'JBIT_Admit_Card.pdf')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Award className="h-4 w-4" />
              <span>Download Admit Card</span>
            </button>
            {latestReceipt && (
              <button
                onClick={() => setSelectedPaymentForReceipt({ _id: latestReceipt.paymentId, receiptNumber: latestReceipt.receiptNumber, studentId: user })}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-emerald-800 border border-emerald-300 shadow-sm hover:bg-emerald-50 transition-colors"
              >
                <Receipt className="h-4 w-4" />
                <span>Receipt</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border-2 border-rose-300 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-rose-100 text-rose-900 text-[11px] font-black uppercase px-2.5 py-0.5 border border-rose-300">
                  Fee Status: {metrics.feeStatus || 'PENDING'}
                </span>
                <span className="text-xs font-bold text-rose-700">Admit Card Locked</span>
              </div>
              <h3 className="text-base font-black text-rose-950 mt-0.5">
                Outstanding Balance: {formatCurrency(pendingAmt)}
              </h3>
              <p className="text-xs font-semibold text-rose-800 mt-0.5">
                Please clear your pending fees to download the admit card.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/pay-fees')}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-all shrink-0"
          >
            <BadgeDollarSign className="h-4 w-4" />
            <span>Pay {formatCurrency(pendingAmt)} Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 6 Required Financial Metrics (Requirement 19) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Fee */}
        <StatCard
          title="Total Fee"
          value={formatCurrency(metrics.totalFee)}
          subtitle="Base Tuition & Other"
          icon={CreditCard}
          color="indigo"
        />

        {/* 2. Paid Amount */}
        <StatCard
          title="Paid Amount"
          value={formatCurrency(metrics.paidFee || metrics.netPaid || metrics.totalPaid)}
          subtitle="Verified Payments"
          icon={CheckCircle2}
          color="emerald"
        />

        {/* 3. Scholarship / Discount */}
        <StatCard
          title="Scholarship"
          value={formatCurrency(metrics.waiverTotal || 0)}
          subtitle="Approved Waivers"
          icon={Tag}
          color="amber"
        />

        {/* 4. Late Fine */}
        <StatCard
          title="Late Fine"
          value={formatCurrency(metrics.lateFineTotal || metrics.totalFine || 0)}
          subtitle="Overdue Penalties"
          icon={AlertTriangle}
          color={metrics.lateFineTotal > 0 ? "rose" : "indigo"}
        />

        {/* 5. Pending Amount */}
        <StatCard
          title="Pending Amount"
          value={formatCurrency(pendingAmt)}
          subtitle={pendingAmt > 0 ? "Outstanding Dues" : "Zero Balance"}
          icon={AlertCircle}
          color={pendingAmt > 0 ? "rose" : "emerald"}
        />

        {/* 6. Fee Status */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Fee Status</p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase ${
                  isClear
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : metrics.feeStatus === 'OVERDUE'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isClear ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                {metrics.feeStatus || (isClear ? 'CLEAR' : 'PENDING')}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {isClear ? 'All fees settled' : `Due: ${formatCurrency(pendingAmt)}`}
          </p>
        </div>
      </div>

      {/* Action Cards Grid for Required Modules (Requirement 19) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-600" />
          Institutional Student Services & Documents
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Pay Fees */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-sm mb-1">
                <BadgeDollarSign className="h-4 w-4" />
                <span>Pay College Fees</span>
              </div>
              <p className="text-xs text-slate-500">
                Pay semester installments online via UPI, Netbanking, or Debit/Credit Cards.
              </p>
            </div>
            <button
              onClick={() => navigate('/pay-fees')}
              className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              <span>Pay Fees</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Card 2: Payment History */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>Payment History</span>
              </div>
              <p className="text-xs text-slate-500">
                View complete ledger of transactions, receipts, and refund adjustments.
              </p>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-white border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <span>View History</span>
            </button>
          </div>

          {/* Card 3: Download Receipt */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm mb-1">
                <Receipt className="h-4 w-4 text-indigo-600" />
                <span>Download Receipts</span>
              </div>
              <p className="text-xs text-slate-500">
                Download verified institutional PDF receipts for your payments.
              </p>
            </div>
            <button
              onClick={() => navigate('/receipts')}
              className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-white border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <span>Access Receipts</span>
            </button>
          </div>

          {/* Card 4: Fee Clearance Certificate */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
            canClearance ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 opacity-90'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <FileCheck className={`h-4 w-4 ${canClearance ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Fee Clearance Certificate</span>
                </div>
                {canClearance ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Eligible</span>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">Locked</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Official statement from JBIT Accounts Division certifying ₹0 dues.
              </p>
            </div>
            {canClearance ? (
              <button
                disabled={downloadingDoc === 'CLEARANCE'}
                onClick={() => handleDownloadDoc('CLEARANCE', '/student/documents/clearance-certificate', 'JBIT_Fee_Clearance_Certificate.pdf')}
                className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Clearance</span>
              </button>
            ) : (
              <button
                disabled
                className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-slate-200 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Locked (Dues Pending)</span>
              </button>
            )}
          </div>

          {/* Card 5: No-Dues Certificate */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
            canNoDues ? 'border-sky-200 bg-sky-50/50' : 'border-slate-200 bg-slate-50 opacity-90'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck className={`h-4 w-4 ${canNoDues ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>No-Dues Certificate</span>
                </div>
                {canNoDues ? (
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">All Clear</span>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">Locked</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Multi-departmental voucher across Tuition, Library, Hostels, and Labs.
              </p>
            </div>
            {canNoDues ? (
              <button
                disabled={downloadingDoc === 'NO_DUES'}
                onClick={() => handleDownloadDoc('NO_DUES', '/student/documents/no-dues-certificate', 'JBIT_No_Dues_Certificate.pdf')}
                className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-sky-700 py-2 text-xs font-bold text-white hover:bg-sky-800 shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download No-Dues</span>
              </button>
            ) : (
              <button
                disabled
                className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg bg-slate-200 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Locked (Clear All Dues)</span>
              </button>
            )}
          </div>

          {/* Card 6: Examination Admit Card */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
            canAdmitCard ? 'border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-500/20' : 'border-rose-200 bg-rose-50/40'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Award className={`h-4 w-4 ${canAdmitCard ? 'text-emerald-600' : 'text-rose-500'}`} />
                  <span>Examination Admit Card</span>
                </div>
                {canAdmitCard ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded">Eligible</span>
                ) : (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">Restricted</span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                Official hall ticket for semester examinations with timetable.
              </p>
            </div>
            {canAdmitCard ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitCardModal(true)}
                  className="flex items-center justify-center gap-1 w-full rounded-lg border border-emerald-300 bg-emerald-50/80 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-xs cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  disabled={downloadingDoc === 'ADMIT_CARD'}
                  onClick={() => handleDownloadDoc('ADMIT_CARD', '/student/documents/admit-card', 'JBIT_Admit_Card.pdf')}
                  className="flex items-center justify-center gap-1 w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-1">
                <button
                  disabled
                  className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-slate-200 py-2 text-xs font-bold text-slate-500 cursor-not-allowed"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Locked (Pending Fees)</span>
                </button>
                <p className="text-[10px] text-center text-rose-600 font-semibold">
                  Clear pending fees to download
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Installments Snapshot */}
      {installments.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Semester Installments Schedule
            </h2>
            <Link to="/fees" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
              View Detailed Fees &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installments.map((inst, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{inst.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inst.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inst.status === 'OVERDUE'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inst.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Due Date: {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-900">{formatCurrency(inst.amount)}</p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Remaining: <span className={inst.remainingAmount === 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(inst.remainingAmount)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for viewing receipt */}
      {selectedPaymentForReceipt && (
        <ReceiptModal
          payment={selectedPaymentForReceipt}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}

      {/* Modal for previewing admit card */}
      <AdmitCardModal
        isOpen={showAdmitCardModal}
        onClose={() => setShowAdmitCardModal(false)}
        student={user}
        isDownloading={downloadingDoc === 'ADMIT_CARD'}
        onDownload={() => handleDownloadDoc('ADMIT_CARD', '/student/documents/admit-card', 'JBIT_Admit_Card.pdf')}
      />
    </div>
  );
};
