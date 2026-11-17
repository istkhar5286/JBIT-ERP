import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no entries available for this view.',
  action = null
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4 shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
