import React from 'react';
import { AlertCircle } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading live data from PRAVAH PostgreSQL service...',
  className = 'py-16',
}) => (
  <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
    <div className="p-3 bg-gov-navy-50 rounded-full border border-gov-navy-200">
      <svg className="w-6 h-6 text-gov-navy-800 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
    <p className="text-xs font-semibold text-slate-700">{message}</p>
    <span className="text-[10px] text-slate-500 font-mono">Querying Express API / PostgreSQL Database</span>
  </div>
);

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Unable to fetch records from backend API service.',
  onRetry,
  className = 'py-12 px-6',
}) => (
  <div className={`bg-rose-50 border border-rose-200 rounded-lg text-center space-y-3 ${className}`}>
    <div className="flex justify-center">
      <div className="p-2 bg-rose-100 rounded-full text-rose-700">
        <AlertCircle className="w-6 h-6" />
      </div>
    </div>
    <div>
      <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">Database API Query Failed</h4>
      <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto leading-relaxed">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold shadow-sm transition"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Retry Connection</span>
      </button>
    )}
  </div>
);

interface EmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  message = 'No application files match your specified filter parameters.',
  className = 'py-12 text-center',
}) => (
  <div className={`flex flex-col items-center justify-center space-y-2 text-slate-500 ${className}`}>
    <div className="p-2.5 bg-slate-100 rounded-full text-slate-400">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <p className="text-xs font-bold text-slate-700">{title}</p>
    <p className="text-[11px] text-slate-500 max-w-sm">{message}</p>
  </div>
);

interface PhaseNoticeProps {
  actionName: string;
}

export const Phase2ActionNotice: React.FC<PhaseNoticeProps> = ({ actionName }) => (
  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px]" title="Phase 2 is database read-only integration. State mutation engine is scheduled for Phase 3.">
    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>{actionName} (Read-only stage)</span>
  </div>
);
