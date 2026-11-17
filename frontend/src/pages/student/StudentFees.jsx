import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BadgeDollarSign,
  Receipt,
  Download,
  Calculator,
  RefreshCw,
  Calendar,
  Tag,
  ShieldCheck,
  Building,
  BookOpen
} from 'lucide-react';

export const StudentFees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/fees');
      if (res.data?.success) {
        setFeeData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch fee details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={1} height="h-32" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <LoadingSkeleton count={6} height="h-28" />
        </div>
        <LoadingSkeleton count={2} height="h-72" />
      </div>
    );
  }

  const { summary = {}, installments = [], waivers = [], payments = [], fines = [] } = feeData || {};
  const isClear = summary.status === 'CLEAR' || Number(summary.pendingAmount || 0) <= 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Quick Pay Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Fee Structure & Installment Ledger
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-black uppercase ${
                isClear
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : summary.status === 'OVERDUE'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isClear ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {summary.status || (isClear ? 'CLEAR' : 'PENDING')}
            </span>
            <button
              onClick={fetchFees}
              title="Refresh ledger"
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            JB Institute of Technology &bull; Academic Session {user?.academicYear || '2024-2025'} &bull; {user?.course}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pay-fees')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
          >
            <BadgeDollarSign className="h-4 w-4" />
            Pay Fees Online
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Total Base Fee"
          value={formatCurrency(summary.baseTotal || summary.academicFee)}
          subtitle="Itemized Components"
          color="indigo"
        />
        <StatCard
          title="Other Charges"
          value={formatCurrency(summary.otherCharges)}
          subtitle="Institutional Services"
          color="indigo"
        />
        <StatCard
          title="Scholarships"
          value={formatCurrency(summary.waiverTotal || 0)}
          subtitle="Applied Waivers"
          color="amber"
        />
        <StatCard
          title="Late Fines"
          value={formatCurrency(summary.totalLateFines || summary.unpaidFineTotal || 0)}
          subtitle="Penalties Accrued"
          color={summary.totalLateFines > 0 ? "rose" : "indigo"}
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(summary.netPaid || summary.totalPaid)}
          subtitle="Net Verified Payments"
          color="emerald"
        />
        <StatCard
          title="Remaining Due"
          value={formatCurrency(summary.pendingAmount)}
          subtitle={isClear ? "Status: CLEAR" : "Status: PENDING"}
          color={isClear ? "emerald" : "rose"}
        />
      </div>

      {/* Itemized Fee Breakdown Table */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              Institutional Fee Structure Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Detailed schedule of all approved fee categories for your academic term
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2.5">
            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Tuition Fee:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(summary.tuitionFee || summary.academicFee || 0)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Examination Fee:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(summary.examinationFee || 0)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Registration Fee:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(summary.registrationFee || 0)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Library & Digital E-Journals:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(summary.libraryFee || 0)}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Laboratory & Workshop Maintenance:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(summary.laboratoryFee || 0)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Hostel Accommodation:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(summary.hostelFee || 0)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Transport / Bus Charges:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(summary.transportFee || 0)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Other College Charges:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(summary.otherCharges || 0)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Calculation Callout */}
        <div className="mt-5 rounded-xl bg-indigo-50/70 border border-indigo-200 p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-indigo-950">
            <Calculator className="h-4 w-4 text-indigo-600" />
            <span>Authoritative Calculation Formula:</span>
          </div>
          <p className="font-mono text-indigo-900 text-[11.5px] leading-relaxed">
            Total Payable ({formatCurrency(summary.totalPayable)}) = Base Fees ({formatCurrency(summary.baseTotal)}) + Other Charges ({formatCurrency(summary.otherCharges)}) + Late Fines ({formatCurrency(summary.totalLateFines)}) - Scholarships ({formatCurrency(summary.waiverTotal || 0)})
          </p>
          <p className="font-mono text-indigo-900 text-[11.5px]">
            Outstanding Balance = Max(Total Payable - Verified Net Paid ({formatCurrency(summary.netPaid || summary.totalPaid)}), 0) = <strong className={isClear ? 'text-emerald-700' : 'text-rose-700'}>{formatCurrency(summary.pendingAmount)}</strong>
          </p>
        </div>
      </div>

      {/* Installments Breakdown (Requirement 4) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Configured Installment Schedules
            </h2>
            <p className="text-xs text-slate-500">
              Automatic payment allocation and late-fine status per installment
            </p>
          </div>
        </div>

        {installments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No installments configured. Full fee is due on enrollment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installments.map((inst, idx) => {
              const isOverdue = inst.status === 'OVERDUE';
              const isPaid = inst.status === 'PAID';
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 transition-all ${
                    isPaid
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : isOverdue
                      ? 'border-rose-300 bg-rose-50/50 ring-1 ring-rose-300'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">{inst.title}</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inst.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Installment Amount:</span>
                      <p className="font-bold text-slate-900">{formatCurrency(inst.amount)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Due Date:</span>
                      <p className="font-semibold text-slate-800">
                        {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Paid Amount:</span>
                      <p className="font-bold text-emerald-700">{formatCurrency(inst.paidAmount)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Remaining Balance:</span>
                      <p className={`font-bold ${inst.remainingAmount === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatCurrency(inst.remainingAmount)}
                      </p>
                    </div>
                  </div>

                  {inst.lateFine > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-rose-100/80 px-2.5 py-1 text-[11px] text-rose-900 font-semibold">
                      <span>Automatic Late Fine Accrued:</span>
                      <span>+{formatCurrency(inst.lateFine)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Applied Scholarships / Waivers (Requirement 8) */}
      {waivers.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="h-4 w-4 text-amber-600" />
            Applied Institutional Scholarships & Fee Waivers
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {waivers.map((w, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{w.title}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                      {w.type}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Reason: {w.reason} &bull; Approved by: {w.approvedBy}
                  </p>
                </div>
                <span className="font-black text-emerald-700 text-sm">
                  -{formatCurrency(w.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Payment Ledger Table */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Payment Ledger & Receipts</h3>
            <p className="text-xs text-slate-500">Every transaction record and download links</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {payments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No payment transactions found. Click "Pay Fees Online" to make a payment.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-3 py-3">Receipt No</th>
                  <th className="px-3 py-3">Transaction ID</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Previous Due</th>
                  <th className="px-3 py-3">Remaining Due</th>
                  <th className="px-3 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-3 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600">
                      {p.transactionId}
                    </td>
                    <td className="px-3 py-3 font-extrabold text-slate-900 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatDateTime(p.paymentDate || p.createdAt)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-indigo-700">
                      {p.paymentMethod}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatCurrency(p.previousDue)}
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-900">
                      {formatCurrency(p.remainingDue)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {p.status === 'SUCCESS' ? (
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No receipt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PDF Receipt Modal */}
      {selectedPayment && (
        <ReceiptModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
          student={user}
        />
      )}
    </div>
  );
};
