import React, { useState, useEffect, useCallback } from 'react';
import { ComplianceItem } from '@saksham/shared';
import { fetchComplianceItems } from '../services/complianceService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { ComplianceBadge } from '../components/ui/StatusBadge';
import {
  ShieldCheck,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export const CompliancePage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadComplianceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplianceItems();
      setComplianceItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load compliance undertakings from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  const filteredItems = complianceItems.filter((item) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'OVERDUE') return item.isOverdue || item.daysRemaining < 0;
    return item.status === filterStatus;
  });

  const handleReminderDispatch = (item: ComplianceItem) => {
    setNoticeMessage(
      `Notice: Statutory reminder/show-cause for ${item.instituteName} ("${item.undertakingType}") staged for Phase 3 dispatch engine.`
    );
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  const handleActionClick = (actionName: string) => {
    setNoticeMessage(`Notice: "${actionName}" is reserved for Phase 3 document verification module.`);
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {noticeMessage && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{noticeMessage}</span>
          <button onClick={() => setNoticeMessage(null)} className="font-bold underline ml-3">Dismiss</button>
        </div>
      )}
      {/* Policy Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gov-green-600" />
            Time-Bound Institutional Undertakings & Conditional Grants
          </h3>
          <p className="text-slate-600 mt-1">
            Where approvals are granted conditionally subject to statutory affidavits (e.g. 90-day Fire Safety NOC renewal, cadre ratio rectification, or revenue mutation), PRAVAH automatically monitors submission deadlines and triggers multi-tier escalations.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded font-semibold">
            Warning: 30 Days
          </span>
          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded font-semibold">
            Show-Cause: 0 Days
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-md font-semibold ${
              filterStatus === 'ALL'
                ? 'bg-gov-navy-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Undertakings ({complianceItems.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE_PENDING')}
            className={`px-3 py-1.5 rounded-md font-semibold ${
              filterStatus === 'ACTIVE_PENDING'
                ? 'bg-sky-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending ({complianceItems.filter((i) => i.status === 'ACTIVE_PENDING').length})
          </button>
          <button
            onClick={() => setFilterStatus('UNDER_REVIEW')}
            className={`px-3 py-1.5 rounded-md font-semibold ${
              filterStatus === 'UNDER_REVIEW'
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Under Review ({complianceItems.filter((i) => i.status === 'UNDER_REVIEW').length})
          </button>
          <button
            onClick={() => setFilterStatus('OVERDUE')}
            className={`px-3 py-1.5 rounded-md font-semibold ${
              filterStatus === 'OVERDUE'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            Overdue ({complianceItems.filter((i) => i.isOverdue || i.daysRemaining < 0).length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live compliance records from PRAVAH PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadComplianceData} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No Undertakings Found"
          message="No compliance undertakings match the selected filter status."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>App Number & Institute</th>
                <th>Undertaking Requirement</th>
                <th>Granted Date</th>
                <th>Statutory Deadline</th>
                <th>Days Remaining</th>
                <th>Compliance Status</th>
                <th>Escalation Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {item.applicationNumber}
                    </div>
                    <div className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                      {item.instituteName}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.region} Region</div>
                  </td>
                  <td>
                    <div className="font-bold text-xs text-slate-900">{item.undertakingType}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 max-w-[280px]">
                      {item.description}
                    </p>
                    {item.submittedDocumentRef && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gov-navy-800 mt-1">
                        <FileText className="w-3 h-3" /> Doc: {item.submittedDocumentRef}
                      </span>
                    )}
                  </td>
                  <td className="text-xs text-slate-700">
                    {new Date(item.grantedDate).toLocaleDateString()}
                  </td>
                  <td className="text-xs font-semibold text-slate-800">
                    {new Date(item.dueDate).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className={`font-mono text-xs font-bold ${
                        item.daysRemaining < 0
                          ? 'text-rose-600'
                          : item.daysRemaining <= 15
                          ? 'text-amber-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {item.daysRemaining < 0
                        ? `${Math.abs(item.daysRemaining)}d OVERDUE`
                        : `${item.daysRemaining} Days`}
                    </span>
                  </td>
                  <td>
                    <ComplianceBadge status={item.status} daysRemaining={item.daysRemaining} />
                  </td>
                  <td>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        item.escalationLevel === 'LEVEL_3_HEARING'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : item.escalationLevel === 'LEVEL_2_SHOW_CAUSE'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : item.escalationLevel === 'LEVEL_1_WARNING'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.escalationLevel.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {item.isOverdue ? (
                      <button
                        onClick={() => handleReminderDispatch(item)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded shadow-sm flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Show Cause
                      </button>
                    ) : item.submittedDocumentRef ? (
                      <button
                        onClick={() => handleActionClick(`Reviewing submitted compliance artifact: ${item.submittedDocumentRef}`)}
                        className="px-2.5 py-1 text-xs font-bold text-gov-navy-900 bg-gov-navy-50 border border-gov-navy-300 rounded hover:bg-gov-navy-100"
                      >
                        Verify Upload
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReminderDispatch(item)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                      >
                        Send Reminder
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
