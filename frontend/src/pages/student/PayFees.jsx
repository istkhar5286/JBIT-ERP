import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { SandboxPaymentModal } from '../../components/common/SandboxPaymentModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  CreditCard,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Receipt,
  Download,
  Loader2,
  Coins
} from 'lucide-react';

export const PayFees = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Sandbox session state
  const [orderSession, setOrderSession] = useState(null);
  const [completedPayment, setCompletedPayment] = useState(null);

  const fetchFeeSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/fees');
      if (res.data?.success) {
        setFeeData(res.data.data.summary);
        // Default amount input to remaining due if > 0
        if (res.data.data.summary.remainingDue > 0) {
          setAmountInput(res.data.data.summary.remainingDue.toString());
        } else {
          setAmountInput('5000');
        }
      }
    } catch (err) {
      console.error('Failed to load fees:', err);
      setError('Failed to fetch fee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeSummary();
  }, []);

  const handleInitiateOrder = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = Number(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/payments/create', {
        amount: parsedAmount,
        paymentMethod
      });

      if (res.data?.success) {
        setOrderSession(res.data.data);
      }
    } catch (err) {
      console.error('Order creation failed:', err);
      setError(err.response?.data?.message || err.message || 'Payment initiation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentCompleted = (result) => {
    // Refresh fee summary
    fetchFeeSummary();
    if (result?.payment && result?.payment?.status === 'SUCCESS') {
      setCompletedPayment(result.payment);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <LoadingSkeleton count={1} height="h-32" />
        <LoadingSkeleton count={2} height="h-48" />
      </div>
    );
  }

  const summary = feeData || { remainingDue: 0, unpaidFineTotal: 0, totalPayable: 0, totalPaid: 0 };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
            <Coins className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Fee Payment Counter</h1>
            <p className="text-xs text-indigo-200">
              Online Fee Reconciliation Portal &bull; Academic Year 2024-2025
            </p>
          </div>
        </div>
      </div>

      {/* Financial Status Quick Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-500">Current Outstanding</p>
          <p className={`text-2xl font-black mt-1 ${summary.remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(summary.remainingDue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {summary.remainingDue === 0 ? 'All fees settled' : 'Immediate fee required'}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Paid</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(summary.totalPaid)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Reconciled payments</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-500">Fee Status</p>
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black uppercase ${
                summary.remainingDue <= 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {summary.remainingDue <= 0 ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              )}
              {summary.remainingDue <= 0 ? 'CLEAR' : 'PENDING'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {summary.remainingDue <= 0 ? 'All dues cleared' : 'Outstanding due pending'}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Payable</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(summary.totalPayable)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Academic + Other + Fines</p>
        </div>
      </div>

      {/* Payment Form Container */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-100 shadow-soft">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900">Initiate Online Fee Payment</h2>
          <p className="text-xs text-slate-500">
            Choose full due payment or enter custom installment amount. All payments are verified on the backend.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleInitiateOrder} className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Payment Amount (INR) *
            </label>
            <div className="relative rounded-2xl border-2 border-slate-200 focus-within:border-indigo-600 transition-colors">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Enter amount to pay"
                className="w-full rounded-2xl py-3.5 pl-10 pr-4 text-xl font-black text-slate-900 focus:outline-none"
              />
            </div>

            {/* Quick Amount Suggestion Buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              {summary.remainingDue > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountInput(summary.remainingDue.toString())}
                  className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  Pay Full Due ({formatCurrency(summary.remainingDue)})
                </button>
              )}
              <button
                type="button"
                onClick={() => setAmountInput('10000')}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                ₹10,000
              </button>
              <button
                type="button"
                onClick={() => setAmountInput('25000')}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                ₹25,000
              </button>
              <button
                type="button"
                onClick={() => setAmountInput('50000')}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                ₹50,000
              </button>
            </div>
          </div>

          {/* Preferred Payment Method */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Preferred Payment Channel
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'UPI', label: 'UPI / QR Code', desc: 'GPay, PhonePe, Paytm' },
                { id: 'CARD', label: 'Debit / Credit Card', desc: 'Visa, MasterCard, RuPay' },
                { id: 'NETBANKING', label: 'Net Banking', desc: 'Major Indian Banks' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    paymentMethod === m.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{m.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notice Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Secure Payment Gateway Simulation</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Clicking "Proceed to Payment" will launch the sandbox gateway modal. You can simulate instant payment success or failure to verify real-time fee recalculations.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing Payment Session...
              </>
            ) : (
              <>
                <span>Proceed to Pay {amountInput ? formatCurrency(amountInput) : ''}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Sandbox Payment Gateway Modal */}
      {orderSession && (
        <SandboxPaymentModal
          isOpen={!!orderSession}
          onClose={() => setOrderSession(null)}
          orderData={orderSession}
          onPaymentComplete={handlePaymentCompleted}
        />
      )}

      {/* Receipt Modal if newly generated */}
      {completedPayment && (
        <ReceiptModal
          isOpen={!!completedPayment}
          onClose={() => setCompletedPayment(null)}
          payment={completedPayment}
          student={user}
        />
      )}
    </div>
  );
};
