import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { AlertTriangle, CheckCircle2, BadgeDollarSign, ShieldAlert, Info } from 'lucide-react';

export const Fines = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/fines');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load fines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={1} height="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton count={3} height="h-28" />
        </div>
        <LoadingSkeleton count={1} height="h-64" />
      </div>
    );
  }

  const { fines = [], unpaidTotal = 0, paidTotal = 0, grandTotal = 0 } = data || {};

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Institutional Penalties & Levies
          </div>
          <h1 className="text-2xl font-black text-slate-900">Student Fines & Penalties</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Any unpaid fines automatically accumulate into your dynamic "Total Fee Payable"
          </p>
        </div>

        {unpaidTotal > 0 && (
          <button
            onClick={() => navigate('/pay-fees')}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-amber-700 transition-colors"
          >
            <BadgeDollarSign className="h-4 w-4" />
            Pay Dues & Fines
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Unpaid Fines"
          value={formatCurrency(unpaidTotal)}
          subtitle="Currently active in fee balance"
          icon={AlertTriangle}
          color={unpaidTotal > 0 ? "rose" : "emerald"}
        />
        <StatCard
          title="Cleared / Paid Fines"
          value={formatCurrency(paidTotal)}
          subtitle="Historical settled penalties"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Lifetime Fines"
          value={formatCurrency(grandTotal)}
          subtitle="All recorded infractions"
          icon={ShieldAlert}
          color="indigo"
        />
      </div>

      {/* Notice Card */}
      <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold">Automated Fee Synchronization:</span> Unpaid fines are dynamically added to your fee calculation. Once admin marks a fine as paid or you clear your balance, it is reconciled immediately.
        </p>
      </div>

      {/* Fines Table */}
      <div className="rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Recorded Fines Ledger</h3>
        </div>

        <div className="overflow-x-auto">
          {fines.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No fines or disciplinary penalties recorded on your account.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Fine Reason / Category</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date Imposed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Settlement Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {f.reason}
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900 text-sm">
                      {formatCurrency(f.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {formatDate(f.imposedDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500">
                      {f.paidDate ? formatDate(f.paidDate) : 'Pending clearance'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
