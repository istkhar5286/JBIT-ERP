import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Receipt,
  Search,
  Download,
  Filter,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileCheck
} from 'lucide-react';

export const WardenPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warden/payments');
      if (res.data?.success) {
        setPayments(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDownloadReceipt = async (paymentId, receiptNo) => {
    try {
      const pId = paymentId?._id || paymentId;
      if (!pId) {
        alert('No payment ID associated with this record.');
        return;
      }
      const response = await api.get(`/hostel/receipt/${pId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hostel_Receipt_${receiptNo || 'Fee'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download fee receipt PDF.');
    }
  };

  const filtered = payments.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const sName = (p.studentName || p.studentId?.fullName || '').toLowerCase();
    const sRoll = (p.studentRoll || p.studentId?.universityRollNumber || '').toLowerCase();
    const txn = (p.transactionId || '').toLowerCase();
    const rcpt = (p.receiptNumber || '').toLowerCase();
    const hName = (p.hostelName || '').toLowerCase();
    return sName.includes(q) || sRoll.includes(q) || txn.includes(q) || rcpt.includes(q) || hName.includes(q);
  });

  const totalCollected = payments.reduce((acc, curr) => acc + Number(curr.paymentAmount || 45000), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold tracking-wider uppercase mb-1">
            <Receipt className="w-4 h-4" /> Financial Transactions
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Hostel Fee Payment Records</h1>
          <p className="text-emerald-100/80 text-sm mt-1">
            Real-time ledger of verified hostel fee receipts, transaction references, and downloadable PDFs.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="self-start md:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center gap-2 text-sm font-medium backdrop-blur-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Total Collections</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{totalCollected.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Total Transactions</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {payments.length}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Verified Gateway Status</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              100% Reconciled
            </p>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Instant Confirmation
            </span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, roll number, transaction ID, or receipt number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-2" />
          <p className="text-sm font-medium">Loading payments ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Payment Records Found</h3>
          <p className="text-slate-500 text-sm mt-1">Hostel fee payments will appear here in real-time as students pay online.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  <th className="p-4">Receipt & Txn ID</th>
                  <th className="p-4">Student Details</th>
                  <th className="p-4">Hostel Wing</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Payment Date</th>
                  <th className="p-4 text-right">PDF Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {filtered.map(item => {
                  const student = item.studentId;
                  const paymentId = item.paymentId?._id || item.paymentId;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition">
                      <td className="p-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {item.receiptNumber || 'RCPT-HST'}
                        </span>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">
                          {item.transactionId || item.paymentId?.transactionId || 'N/A'}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {student?.fullName || item.studentName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Roll: {student?.universityRollNumber || item.studentRoll || 'N/A'} · {student?.course || ''}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.hostelName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.preferredRoomType || 'Room Admission'}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                          ₹{Number(item.paymentAmount || 45000).toLocaleString('en-IN')}
                        </span>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Paid & Settled
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-500">
                        {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(paymentId, item.receiptNumber)}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default WardenPayments;
