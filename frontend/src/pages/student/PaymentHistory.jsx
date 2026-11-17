import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Receipt, Search, Download, Filter, RefreshCw } from 'lucide-react';

export const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/payments');
      if (res.data?.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      p.paymentMethod?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Fee Payment History & Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete archive of your financial transactions and official digital receipts
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Receipt No, Transaction ID, or Payment Mode..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="PENDING">Pending Only</option>
            <option value="FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} height="h-12" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No payment records matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-3.5 py-3.5">Receipt No</th>
                  <th className="px-3.5 py-3.5">Transaction ID</th>
                  <th className="px-3.5 py-3.5">Payment Date</th>
                  <th className="px-3.5 py-3.5">Method</th>
                  <th className="px-3.5 py-3.5">Previous Due</th>
                  <th className="px-3.5 py-3.5">Amount Paid</th>
                  <th className="px-3.5 py-3.5">Remaining Due</th>
                  <th className="px-3.5 py-3.5">Status</th>
                  <th className="px-3.5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3.5 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="px-3.5 py-3.5 font-mono text-slate-600">
                      {p.transactionId}
                    </td>
                    <td className="px-3.5 py-3.5 text-slate-600">
                      {formatDateTime(p.paymentDate || p.createdAt)}
                    </td>
                    <td className="px-3.5 py-3.5 font-bold text-indigo-700">
                      {p.paymentMethod}
                    </td>
                    <td className="px-3.5 py-3.5 text-slate-600">
                      {formatCurrency(p.previousDue)}
                    </td>
                    <td className="px-3.5 py-3.5 font-extrabold text-slate-900 text-sm">
                      {formatCurrency(p.amount)}
                      {p.totalRefunded > 0 && (
                        <span className="block text-[10px] text-amber-600 font-semibold">
                          (Refunded: {formatCurrency(p.totalRefunded)})
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3.5 font-bold text-slate-900">
                      {formatCurrency(p.remainingDue)}
                    </td>
                    <td className="px-3.5 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={p.status} />
                        {p.refundStatus && p.refundStatus !== 'NONE' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Refund: {p.refundStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 text-right">
                      {p.status === 'SUCCESS' ? (
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Receipt
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No receipt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
