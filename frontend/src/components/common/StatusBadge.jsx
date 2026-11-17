import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (['SUCCESS', 'PAID', 'ACTIVE', 'CLEARED', 'EXCELLENT', 'GOOD'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (['PENDING', 'UNPAID', 'WARNING', 'SHORTAGE WARNING'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (['FAILED', 'CANCELLED', 'INACTIVE', 'CRITICAL SHORTAGE', 'DETAINED/CRITICAL'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (['UPI', 'CARD', 'NETBANKING', 'CASH', 'DEMAND_DRAFT'].includes(normalized)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${styles} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
