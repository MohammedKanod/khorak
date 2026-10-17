import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (status.toUpperCase()) {
    case 'CRITICAL':
    case 'RED':
      bg = 'bg-red-50 text-red-700 border-red-200';
      label = 'Critical Low';
      break;
    case 'LOW':
    case 'AMBER':
    case 'OPEN':
    case 'PENDING_REVIEW':
    case 'PENDING_SUPERVISOR':
    case 'PENDING_CDPO':
    case 'RECOUNT_REQUESTED':
      bg = 'bg-amber-50 text-amber-800 border-amber-200';
      label = status.replace(/_/g, ' ');
      break;
    case 'ADEQUATE':
    case 'FULL':
    case 'GREEN':
    case 'CONFIRMED':
    case 'APPROVED':
    case 'APPROVED_ADJUSTED':
    case 'MATCHED':
    case 'RESOLVED':
    case 'RECEIVED':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = status.replace(/_/g, ' ');
      break;
    case 'PARTIALLY_RECEIVED':
    case 'EXCEPTION_FLAGGED':
    case 'HAS_DISCREPANCIES':
      bg = 'bg-orange-50 text-orange-800 border-orange-200';
      label = 'Partial / Flagged';
      break;
    case 'REJECTED':
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Rejected';
      break;
    case 'DISPATCHED':
      bg = 'bg-sky-50 text-sky-700 border-sky-200';
      label = 'In Transit';
      break;
    default:
      label = status.replace(/_/g, ' ');
  }

  const py = size === 'sm' ? 'py-0.5 px-2 text-[11px]' : 'py-1 px-2.5 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${bg} ${py} uppercase tracking-wider`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {label}
    </span>
  );
};
