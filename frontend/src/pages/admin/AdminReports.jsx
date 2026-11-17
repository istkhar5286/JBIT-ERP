import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  CreditCard,
  History,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';

export const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('fees'); // 'fees' | 'payments' | 'fines'
  const [feeReport, setFeeReport] = useState(null);
  const [paymentReport, setPaymentReport] = useState(null);
  const [fineReport, setFineReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const [fRes, pRes, fnRes] = await Promise.all([
        api.get('/admin/reports/fees'),
        api.get('/admin/reports/payments'),
        api.get('/admin/reports/fines')
      ]);

      if (fRes.data?.success) setFeeReport(fRes.data.data);
      if (pRes.data?.success) setPaymentReport(pRes.data.data);
      if (fnRes.data?.success) setFineReport(fnRes.data.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // CSV Export utility
  const exportToCsv = (filename, headers, rows) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExport = async () => {
    try {
      const type = activeTab === 'payments' ? 'payments' : 'fees';
      const response = await api.get(`/admin/reports/export-csv?type=${type}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JBIT_${type.toUpperCase()}_REPORT_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.warn('Backend CSV stream failed, utilizing client-side generator', err);
      if (activeTab === 'fees') {
        const headers = [
          'Roll Number',
          'Student Name',
          'Course',
          'Semester',
          'Academic Fee',
          'Other Charges',
          'Unpaid Fines',
          'Total Payable',
          'Total Paid',
          'Remaining Due',
          'Extra Advance'
        ];
        const rows = (feeReport?.rows || []).map((r) => [
          r.rollNumber,
          r.name,
          r.course,
          r.semester,
          r.academicFee,
          r.otherCharges,
          r.unpaidFines,
          r.totalPayable,
          r.totalPaid,
          r.remainingDue,
          r.extraPayment
        ]);
        exportToCsv('JBIT_Student_Fees_Due_Report', headers, rows);
      } else if (activeTab === 'payments') {
        const headers = [
          'Receipt Number',
          'Transaction ID',
          'Student Name',
          'Roll Number',
          'Amount',
          'Date',
          'Method',
          'Status',
          'Remaining Due'
        ];
        const rows = (paymentReport?.rows || []).map((p) => [
          p.receiptNumber,
          p.transactionId,
          p.studentId?.fullName || '',
          p.studentId?.universityRollNumber || '',
          p.amount,
          p.paymentDate || p.createdAt,
          p.paymentMethod,
          p.status,
          p.remainingDue
        ]);
        exportToCsv('JBIT_Payment_Collections_Report', headers, rows);
      } else {
        const headers = ['Student Name', 'Roll Number', 'Category', 'Amount', 'Date Imposed', 'Status'];
        const rows = (fineReport?.rows || []).map((f) => [
          f.studentId?.fullName || '',
          f.studentId?.universityRollNumber || '',
          f.reason,
          f.amount,
          f.imposedDate,
          f.status
        ]);
        exportToCsv('JBIT_Fines_Report', headers, rows);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft border border-slate-100 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Institutional Financial Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Exportable audits for fee reconciliations, revenue collections, and student balance sheets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold no-print">
        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'fees'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Student Dues & Receivables</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Payment Transactions Ledger</span>
        </button>
        <button
          onClick={() => setActiveTab('fines')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'fines'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Fine & Penalties Collection</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : (
        <>
          {/* TAB 1: Student Dues Report */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Gross Receivables</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(feeReport?.totals?.totalPayable)}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Collected</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{formatCurrency(feeReport?.totals?.totalPaid)}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Outstanding Due</p>
                  <p className="text-xl font-black text-rose-600 mt-0.5">{formatCurrency(feeReport?.totals?.totalDue)}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Advance Credit</p>
                  <p className="text-xl font-black text-sky-600 mt-0.5">{formatCurrency(feeReport?.totals?.totalExtra)}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Roll Number</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Course / Sem</th>
                        <th className="px-4 py-3">Tuition Fee</th>
                        <th className="px-4 py-3">Other Charges</th>
                        <th className="px-4 py-3">Unpaid Fines</th>
                        <th className="px-4 py-3">Total Payable</th>
                        <th className="px-4 py-3">Total Paid</th>
                        <th className="px-4 py-3">Remaining Due</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {feeReport?.rows?.map((r) => (
                        <tr key={r.studentId} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-700">{r.rollNumber}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{r.name}</td>
                          <td className="px-4 py-3 text-slate-600">{r.course} (Sem {r.semester})</td>
                          <td className="px-4 py-3 text-slate-600">{formatCurrency(r.academicFee)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatCurrency(r.otherCharges)}</td>
                          <td className="px-4 py-3 text-amber-700 font-medium">{formatCurrency(r.unpaidFines)}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(r.totalPayable)}</td>
                          <td className="px-4 py-3 font-bold text-emerald-700">{formatCurrency(r.totalPaid)}</td>
                          <td className="px-4 py-3 font-black text-rose-600">{formatCurrency(r.remainingDue)}</td>
                          <td className="px-4 py-3 text-right">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Payments Report */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Successful Collections</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">
                    {formatCurrency(paymentReport?.summary?.totalSuccessAmount)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Reconciled Transactions</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {paymentReport?.summary?.successCount || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Pending Transactions</p>
                  <p className="text-xl font-black text-amber-600 mt-0.5">
                    {paymentReport?.summary?.pendingCount || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Failed / Cancelled</p>
                  <p className="text-xl font-black text-rose-600 mt-0.5">
                    {paymentReport?.summary?.failedCount || 0}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Receipt No</th>
                        <th className="px-4 py-3">Transaction ID</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Roll No</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentReport?.rows?.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-700">{p.receiptNumber}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{p.transactionId}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{p.studentId?.fullName || '-'}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{p.studentId?.universityRollNumber || '-'}</td>
                          <td className="px-4 py-3 font-extrabold text-slate-900 text-sm">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(p.paymentDate || p.createdAt)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{p.paymentMethod}</td>
                          <td className="px-4 py-3 text-right">
                            <StatusBadge status={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Fines Report */}
          {activeTab === 'fines' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Fines Imposed</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {formatCurrency((fineReport?.summary?.paidAmount || 0) + (fineReport?.summary?.unpaidAmount || 0))}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Collected Fines</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">
                    {formatCurrency(fineReport?.summary?.paidAmount)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Pending Fines</p>
                  <p className="text-xl font-black text-rose-600 mt-0.5">
                    {formatCurrency(fineReport?.summary?.unpaidAmount)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-100 shadow-soft">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Infractions</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">
                    {fineReport?.totalFines || 0}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Roll Number</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Imposed Date</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fineReport?.rows?.map((f) => (
                        <tr key={f._id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-bold text-slate-900">{f.studentId?.fullName || '-'}</td>
                          <td className="px-4 py-3 font-mono text-indigo-700">{f.studentId?.universityRollNumber || '-'}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{f.reason}</td>
                          <td className="px-4 py-3 font-extrabold text-slate-900 text-sm">{formatCurrency(f.amount)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(f.imposedDate)}</td>
                          <td className="px-4 py-3 text-right">
                            <StatusBadge status={f.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
