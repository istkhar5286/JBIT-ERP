import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { ScreenshotModal } from '../../components/common/ScreenshotModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  History,
  Search,
  Filter,
  Download,
  Receipt,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Upload,
  AlertCircle,
  Eye,
  Check,
  X,
  FileText,
  ShieldCheck,
  CreditCard,
  Loader2
} from 'lucide-react';

export const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'pending' | 'qr_settings'

  // Ledger state
  const [payments, setPayments] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Pending verification state
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);
  const [rejectModalPayment, setRejectModalPayment] = useState(null);
  const [rejectReason, setRejectReason] = useState('Transaction reference or payment screenshot could not be verified.');

  // QR Settings state
  const [qrSettings, setQrSettings] = useState({
    qrCode: '',
    upiId: '',
    paymentName: '',
    paymentInstructions: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [qrUploadError, setQrUploadError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Global alert
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  const fetchPayments = async () => {
    try {
      setLoadingLedger(true);
      const params = {
        search,
        status: statusFilter,
        paymentMethod: methodFilter,
        startDate,
        endDate,
        limit: 100
      };
      const res = await api.get('/admin/payments', { params });
      if (res.data?.success) {
        setPayments(res.data.data.payments || []);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      setLoadingPending(true);
      const res = await api.get('/admin/payments/pending');
      if (res.data?.success) {
        setPendingPayments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load pending payments:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchQrSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await api.get('/admin/payment-settings');
      if (res.data?.success) {
        setQrSettings(res.data.data || {});
      }
    } catch (err) {
      console.error('Failed to load QR settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchPendingPayments();
  }, [statusFilter, methodFilter, startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingPayments();
    } else if (activeTab === 'qr_settings') {
      fetchQrSettings();
    }
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleDownloadPdf = async (payment) => {
    try {
      const response = await api.get(`/payments/${payment._id}/receipt`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${payment.receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF receipt');
    }
  };

  // Approve pending payment
  const handleApprovePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to approve this payment? This will finalize the seat/bed allocation immediately.')) {
      return;
    }
    try {
      setActionLoadingId(paymentId);
      const res = await api.post(`/admin/payments/${paymentId}/approve`);
      if (res.data?.success) {
        setAlertMsg({
          type: 'success',
          text: `Payment successfully approved! ${res.data.data?.allocationResult ? `Allocation confirmed.` : ''}`
        });
        await fetchPendingPayments();
        await fetchPayments();
      }
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to approve payment.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject pending payment
  const handleConfirmReject = async () => {
    if (!rejectModalPayment) return;
    try {
      setActionLoadingId(rejectModalPayment._id);
      const res = await api.post(`/admin/payments/${rejectModalPayment._id}/reject`, {
        reason: rejectReason
      });
      if (res.data?.success) {
        setAlertMsg({
          type: 'success',
          text: 'Payment rejected. Student has been notified.'
        });
        setRejectModalPayment(null);
        await fetchPendingPayments();
        await fetchPayments();
      }
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reject payment.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle QR image file selection
  const handleQrFileChange = (e) => {
    setQrUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setQrUploadError('Only PNG, JPG or JPEG image formats are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setQrUploadError('File size exceeds the 5MB maximum limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      setQrSettings(prev => ({ ...prev, qrCode: uploadEvt.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Save QR Settings
  const handleSaveQrSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccess('');
      setQrUploadError('');

      const res = await api.post('/admin/payment-settings', qrSettings);
      if (res.data?.success) {
        setSettingsSuccess('Payment QR Code and UPI settings saved successfully!');
        setQrSettings(res.data.data);
      }
    } catch (err) {
      setQrUploadError(err.response?.data?.message || 'Failed to save payment settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-soft border border-slate-100 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" /> Financial Administration
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Institutional Payments & Verification</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage fee collections, verify manual QR payments, and configure college UPI settings
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Payment Ledger
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 relative ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pending Verification
            {pendingPayments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('qr_settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'qr_settings'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Payment QR Code & Settings
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {alertMsg.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-medium border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: INSTITUTIONAL PAYMENT LEDGER */}
      {/* ==================================================== */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Multi-Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, roll number, receipt, txn..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
              />
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:border-indigo-600 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="REJECTED">Rejected Only</option>
              <option value="FAILED">Failed Only</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:border-indigo-600 focus:outline-none"
            >
              <option value="">All Payment Modes</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="NETBANKING">Net Banking</option>
              <option value="CASH">Cash Counter</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-indigo-600 focus:outline-none"
                title="Start Date"
              />
              <button
                onClick={fetchPayments}
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Payment Ledger Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-800 shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden">
            {loadingLedger ? (
              <div className="p-6">
                <LoadingSkeleton count={6} height="h-12" />
              </div>
            ) : payments.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No payments found matching your filter parameters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-3.5 py-3">Student</th>
                      <th className="px-3.5 py-3">Roll Number</th>
                      <th className="px-3.5 py-3">Receipt No</th>
                      <th className="px-3.5 py-3">Purpose / Notes</th>
                      <th className="px-3.5 py-3">Amount</th>
                      <th className="px-3.5 py-3">Date</th>
                      <th className="px-3.5 py-3">Mode / UTR</th>
                      <th className="px-3.5 py-3">Status</th>
                      <th className="px-3.5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {payments.map((p) => {
                      const student = p.studentId || {};
                      return (
                        <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-3.5 py-3.5 font-bold text-slate-900 dark:text-white">
                            {student.fullName || 'Student'}
                          </td>
                          <td className="px-3.5 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                            {student.universityRollNumber || '-'}
                          </td>
                          <td className="px-3.5 py-3.5 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                            {p.receiptNumber}
                          </td>
                          <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title={p.purpose}>
                            {p.purpose || 'Fee Payment'}
                          </td>
                          <td className="px-3.5 py-3.5 font-extrabold text-slate-900 dark:text-white text-sm">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatDateTime(p.paymentDate || p.createdAt)}
                          </td>
                          <td className="px-3.5 py-3.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{p.paymentMethod}</span>
                            {p.utrNumber && (
                              <div className="font-mono text-[10px] text-slate-400">UTR: {p.utrNumber}</div>
                            )}
                          </td>
                          <td className="px-3.5 py-3.5">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-3.5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.paymentScreenshot && (
                                <button
                                  onClick={() => setPreviewScreenshot(p.paymentScreenshot)}
                                  className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                                  title="View Payment Screenshot"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              {p.status === 'SUCCESS' && (
                                <>
                                  <button
                                    onClick={() => setSelectedPayment(p)}
                                    className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                                    title="View Receipt"
                                  >
                                    <Receipt className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadPdf(p)}
                                    className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                    title="Download PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: PENDING VERIFICATION */}
      {/* ==================================================== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong className="block text-xs font-bold uppercase tracking-wider">Manual UPI / QR Payment Verification Desk</strong>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Verify UTR numbers and payment screenshots submitted by students. Approving a payment will atomically allocate the selected bus seat or hostel bed.
                </p>
              </div>
            </div>
            <button
              onClick={fetchPendingPayments}
              className="px-3 py-1.5 bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-800 shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden">
            {loadingPending ? (
              <div className="p-6">
                <LoadingSkeleton count={4} height="h-16" />
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200">All caught up!</h3>
                <p className="text-xs text-slate-400">There are currently no manual payments pending administrative verification.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3.5">Student Details</th>
                      <th className="px-4 py-3.5">Payment Purpose</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">UTR / Txn ID</th>
                      <th className="px-4 py-3.5">Screenshot</th>
                      <th className="px-4 py-3.5">Submission Date</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {pendingPayments.map((p) => {
                      const student = p.studentId || {};
                      const isActing = actionLoadingId === p._id;

                      return (
                        <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-900 dark:text-white block text-sm">
                              {student.fullName || 'Student'}
                            </span>
                            <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] block">
                              Roll: {student.universityRollNumber || '-'}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {student.course} · {student.branch}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 max-w-[220px]">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {p.purpose || 'Fee Payment'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              {p.allocationType || 'PAYMENT'}
                            </span>
                            {p.selectedSeatNumber && (
                              <span className="ml-1 text-[11px] text-emerald-600 font-bold">
                                Seat #{p.selectedSeatNumber}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white text-base">
                            {formatCurrency(p.amount)}
                          </td>

                          <td className="px-4 py-3.5 font-mono">
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 inline-block">
                              {p.utrNumber || p.transactionId}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            {p.paymentScreenshot ? (
                              <button
                                onClick={() => setPreviewScreenshot(p.paymentScreenshot)}
                                className="group relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:ring-2 hover:ring-indigo-500 transition"
                                title="Click to inspect full screenshot"
                              >
                                <img
                                  src={p.paymentScreenshot}
                                  alt="Screenshot"
                                  className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No image</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                            {formatDateTime(p.paymentDate || p.createdAt)}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              PENDING
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprovePayment(p._id)}
                                disabled={isActing}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {isActing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Approve Payment
                              </button>

                              <button
                                onClick={() => {
                                  setRejectModalPayment(p);
                                  setRejectReason('Transaction reference or payment screenshot could not be verified.');
                                }}
                                disabled={isActing}
                                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: PAYMENT QR CODE & SETTINGS */}
      {/* ==================================================== */}
      {activeTab === 'qr_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Live QR Preview & Upload Card */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-soft space-y-6">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">College Payment QR Code</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This official QR code will be displayed to all students during Bus Booking and Hostel accommodation payments.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
              {qrSettings.qrCode ? (
                <div className="relative group p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  <img
                    src={qrSettings.qrCode}
                    alt="Active Payment QR"
                    className="w-48 h-48 object-contain rounded-xl"
                  />
                  <div className="mt-2 text-center">
                    <span className="text-[11px] font-mono font-bold text-slate-700 block">{qrSettings.upiId || 'UPI ID not set'}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">✓ Active Preview</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <QrCode className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-xs">No QR Code uploaded yet.</p>
                </div>
              )}

              {/* Upload Input */}
              <div className="mt-6 w-full">
                <label className="block w-full cursor-pointer px-4 py-2.5 rounded-xl border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold text-center transition flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  {qrSettings.qrCode ? 'Replace QR Code Image' : 'Upload QR Code Image'}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleQrFileChange}
                    className="hidden"
                  />
                </label>
                <span className="block text-center text-[10px] text-slate-400 mt-1.5">
                  PNG or JPG/JPEG (Max 5MB)
                </span>
              </div>
            </div>

            {qrUploadError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{qrUploadError}</span>
              </div>
            )}
          </div>

          {/* Column 2 & 3: Configuration Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-soft space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Payment Gateway & UPI Parameters</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure your beneficiary title, UPI VPA identifier, and instructions shown on the student Scan & Pay screen.
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveQrSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Beneficiary / College Name
                </label>
                <input
                  type="text"
                  value={qrSettings.paymentName || ''}
                  onChange={(e) => setQrSettings({ ...qrSettings, paymentName: e.target.value })}
                  placeholder="e.g. JB Institute of Technology, Dehradun"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Official UPI ID / VPA
                </label>
                <input
                  type="text"
                  value={qrSettings.upiId || ''}
                  onChange={(e) => setQrSettings({ ...qrSettings, upiId: e.target.value })}
                  placeholder="e.g. jbitdehradun@sbi or accounts@upi"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-indigo-600 focus:outline-none"
                  required
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  Students can copy this UPI ID to manually pay through any banking or UPI app.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Payment Instructions for Students
                </label>
                <textarea
                  value={qrSettings.paymentInstructions || ''}
                  onChange={(e) => setQrSettings({ ...qrSettings, paymentInstructions: e.target.value })}
                  placeholder="Instructions displayed on student payment screen..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Save Payment QR & UPI Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Payment Reason Dialog */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Reject Payment Verification</span>
              </div>
              <button onClick={() => setRejectModalPayment(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
                <div>Student: <strong className="text-slate-900 dark:text-white">{rejectModalPayment.studentId?.fullName}</strong></div>
                <div>Amount: <strong className="text-slate-900 dark:text-white">{formatCurrency(rejectModalPayment.amount)}</strong></div>
                <div>UTR: <strong className="font-mono text-slate-900 dark:text-white">{rejectModalPayment.utrNumber}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Reason for Rejection (Visible to Student)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRejectModalPayment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={actionLoadingId === rejectModalPayment._id}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow transition flex items-center gap-1.5"
                >
                  {actionLoadingId === rejectModalPayment._id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Full Viewer Modal */}
      {previewScreenshot && (
        <ScreenshotModal
          isOpen={!!previewScreenshot}
          onClose={() => setPreviewScreenshot(null)}
          imageSrc={previewScreenshot}
        />
      )}

      {/* PDF Receipt Modal */}
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

export default AdminPayments;
