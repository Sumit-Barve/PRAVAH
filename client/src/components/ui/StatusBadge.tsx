import React from 'react';
import {
  ApplicationStage,
  PriorityLevel,
  ValidityStatus,
  ComplianceStatus,
  EVCStatus,
} from '@saksham/shared';

export const StageBadge: React.FC<{ stage: ApplicationStage; className?: string }> = ({
  stage,
  className = '',
}) => {
  const configs: Record<ApplicationStage, { label: string; bg: string; text: string; border: string }> = {
    SUBMITTED: { label: 'Submitted', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    SCRUTINY: { label: 'Scrutiny', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    RE_SCRUTINY: { label: 'Re-Scrutiny', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
    EVC_SCHEDULED: { label: 'EVC Scheduled', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300' },
    EVC_COMPLETED: { label: 'EVC Completed', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
    SHC_HEARING: { label: 'SHC Hearing', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
    SAC_APPEAL: { label: 'SAC Appeal', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300' },
    APPROVED_CONDITIONAL: { label: 'Conditional Approval', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
    APPROVAL_GRANTED: { label: 'Approval Granted', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-400' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300' },
  };

  const config = configs[stage] || configs.SUBMITTED;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {config.label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel; className?: string }> = ({
  priority,
  className = '',
}) => {
  const configs: Record<PriorityLevel, { label: string; bg: string; text?: string; dot?: boolean }> = {
    NORMAL: { label: 'Normal', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    MEDIUM: { label: 'Medium', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    HIGH: { label: 'High Priority', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
    CRITICAL_OVERDUE: { label: 'Overdue / Critical', bg: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold', dot: true },
  };

  const config = configs[priority] || configs.NORMAL;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${config.bg} ${className}`}
    >
      {config.dot && (
        <span className="w-2 h-2 rounded-full mr-1.5 bg-rose-500 animate-pulse"></span>
      )}
      {config.label}
    </span>
  );
};

export const ValidityBadge: React.FC<{ status: ValidityStatus; days: number }> = ({
  status,
  days,
}) => {
  switch (status) {
    case 'VALID':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
          Valid ({days > 0 ? `${days}d` : 'Current'})
        </span>
      );
    case 'EXPIRING_SOON':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300">
          Expiring in {days}d
        </span>
      );
    case 'CRITICAL_WARNING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-300">
          Urgent ({days}d left)
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
          Expired ({Math.abs(days)}d ago)
        </span>
      );
    default:
      return null;
  }
};

export const ComplianceBadge: React.FC<{ status: ComplianceStatus; daysRemaining: number }> = ({
  status,
  daysRemaining,
}) => {
  switch (status) {
    case 'VERIFIED_SATISFACTORY':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
          Verified Satisfactory
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
          Under Review
        </span>
      );
    case 'OVERDUE_ESCALATED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
          Overdue ({Math.abs(daysRemaining)}d)
        </span>
      );
    case 'ACTIVE_PENDING':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-300">
          Due in {daysRemaining}d
        </span>
      );
  }
};

export const EVCBadge: React.FC<{ status: EVCStatus; delayHours?: number }> = ({
  status,
  delayHours = 0,
}) => {
  switch (status) {
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-800 border border-cyan-300">
          Visit Scheduled
        </span>
      );
    case 'CONSTITUTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
          Committee Constituted
        </span>
      );
    case 'VISIT_COMPLETED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-800 border border-teal-300">
          Visit Done (Report Awaited)
        </span>
      );
    case 'REPORT_SUBMITTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
          Report Uploaded
        </span>
      );
    case 'REPORT_OVERDUE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
          Report Overdue (+{delayHours}h)
        </span>
      );
    case 'PENDING_CONSTITUTION':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          Constitution Pending
        </span>
      );
  }
};
