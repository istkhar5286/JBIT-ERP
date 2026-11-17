import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Receipt, Download, FileText, CheckCircle2, Search } from 'lucide-react';

export const Receipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const loadReceipts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/payments');
        if (res.data?.success) {
          // Filter only successful payments that have official receipts
          const successPayments = res.data.data.filter((p) => p.status === 'SUCCESS');
          setReceipts(successPayments);
        }
      } catch (err) {
        console.error('Failed to load receipts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReceipts();
  }, []);

  const handleDownloadDirect = async (payment) => {
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
      console.error('Download receipt error:', err);
      alert('Error downloading receipt PDF');
    }
  };

  const filtered = receipts.filter(
    (r) =>
      r.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.transactionId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Official Payment Receipts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Download or print digitally verified college fee receipts for tax and semester clearance
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt number..."
            className="rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-24" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center text-xs text-slate-400 border border-slate-100">
          No verified receipts found. Once a payment is successful, your official receipt will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div
              key={r._id}
              className="rounded-2xl bg-white p-5 shadow-soft border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-900">{r.receiptNumber}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    PAID
                  </span>
                </div>

                <div className="py-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(r.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Date:</span>
                    <span className="text-slate-700">{formatDateTime(r.paymentDate || r.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono text-slate-600 truncate max-w-[150px]">{r.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(r.remainingDue)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setSelectedReceipt(r)}
                  className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  View Preview
                </button>
                <button
                  onClick={() => handleDownloadDirect(r)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
          student={user}
        />
      )}
    </div>
  );
};
