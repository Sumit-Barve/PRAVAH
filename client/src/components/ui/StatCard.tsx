import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeVariant?: 'default' | 'amber' | 'emerald' | 'rose' | 'navy';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeVariant = 'default',
  onClick,
}) => {
  const badgeClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
    rose: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
    navy: 'bg-gov-navy-50 text-gov-navy-900 border-gov-navy-200',
  }[badgeVariant];

  const clickableClasses = onClick
    ? 'cursor-pointer hover:border-gov-navy-500 hover:shadow-md transition-all duration-150'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${clickableClasses} relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-700">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-gov-navy-800">
          <Icon className="w-5 h-5 text-gov-navy-700" />
        </div>
      </div>

      {(subtext || badgeText) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtext && <span className="text-slate-600 truncate">{subtext}</span>}
          {badgeText && (
            <span className={`px-1.5 py-0.5 rounded text-[11px] border ${badgeClasses}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
