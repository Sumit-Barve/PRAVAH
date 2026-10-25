import React, { useState, useEffect, useCallback } from 'react';
import { EVCInspection } from '@saksham/shared';
import { fetchEVCInspections } from '../services/evcService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { EVCBadge } from '../components/ui/StatusBadge';
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Send,
} from 'lucide-react';

export const EVCManagementPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [inspections, setInspections] = useState<EVCInspection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadEVCData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEVCInspections();
      setInspections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load EVC inspections from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEVCData();
  }, [loadEVCData]);

  const filteredInspections = inspections.filter((i) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'OVERDUE') return i.isOverdue || i.status === 'REPORT_OVERDUE';
    return i.status === filterStatus;
  });

  const handleEscalationNotice = (inspection: EVCInspection) => {
    setActionNotice(
      `Notice: Formal 48-Hour SLA Breach Notice dispatch for ${inspection.applicationNumber} (Convener: ${inspection.convenerName}) is staged for Phase 3. No mutation committed.`
    );
    setTimeout(() => setActionNotice(null), 6000);
  };

  const handleActionClick = (actionDescription: string) => {
    setActionNotice(`Notice: "${actionDescription}" is reserved for Phase 3 workflow engine.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {actionNotice && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold underline ml-3">Dismiss</button>
        </div>
      )}

      {/* Statutory EVC Regulation Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              Statutory EVC Reporting SLA (APH Sec 1.5.4):
            </span>
            <span className="font-mono text-slate-300">Strict 48-Hour Rule</span>
          </div>
          <p className="text-slate-300 mt-1">
            Expert Visit Committee (EVC) conveners are statutorily required to upload signed observation reports, geo-tagged photography, and infrastructure verification forms within 48 hours of physical inspection.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-slate-800 rounded border border-slate-700 font-mono text-amber-400 text-xs font-bold whitespace-nowrap">
          Max Turnaround: 48h
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex space-x-3 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-md font-semibold ${
              filterStatus === 'ALL'
                ? 'bg-gov-navy-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Inspections ({inspections.length})
          </button>
          <button
            onClick={() => setFilterStatus('SCHEDULED')}
            className={`px-3 py-1.5 rounded-md font-semibold ${
              filterStatus === 'SCHEDULED'
                ? 'bg-cyan-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilterStatus('OVERDUE')}
            className={`px-3 py-1.5 rounded-md font-semibold ${
              filterStatus === 'OVERDUE'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            Report Overdue (Action Required)
          </button>
          <button
            onClick={() => setFilterStatus('REPORT_SUBMITTED')}
            className={`px-3 py-1.5 rounded-md font-semibold ${
              filterStatus === 'REPORT_SUBMITTED'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Reports Completed
          </button>
        </div>

        <button
          onClick={() => handleActionClick('Constitute New EVC Committee')}
          className="px-3 py-1.5 bg-gov-navy-900 text-white hover:bg-gov-navy-800 rounded text-xs font-semibold shadow-sm hidden sm:inline-block"
        >
          + Constitute New EVC
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live EVC records from PRAVAH PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEVCData} />
      ) : filteredInspections.length === 0 ? (
        <EmptyState
          title="No Inspections Found"
          message="No EVC inspection records match the current filter selection."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInspections.map((inspection) => (
            <div
              key={inspection.id}
              className={`bg-white rounded-lg border p-4 shadow-sm space-y-3 transition ${
                inspection.isOverdue ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
              }`}
            >
              {/* Header: App No & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-gov-navy-900">
                    {inspection.applicationNumber}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {inspection.instituteName}
                  </h3>
                  <p className="text-xs text-slate-500">Regional Jurisdiction: {inspection.region}</p>
                </div>
                <EVCBadge status={inspection.status} delayHours={inspection.delayHours} />
              </div>

              {/* Visit Dates & Overdue Banner */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Proposed Date:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(inspection.proposedDate).toLocaleDateString()}
                  </span>
                </div>
                {inspection.actualVisitDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Physical Visit Concluded:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {new Date(inspection.actualVisitDate).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Committee Composition */}
              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                  Committee Convener & Experts
                </p>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-slate-700">
                  <div className="font-semibold text-gov-navy-950 flex items-center justify-between">
                    <span>Convener: {inspection.convenerName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {inspection.convenerAffiliation}
                    </span>
                  </div>
                  {inspection.expertMembers?.map((member, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200">
                      <span>{member.name} ({member.specialization})</span>
                      <span className="text-slate-400">{member.designation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overdue Alert Bar */}
              {inspection.isOverdue && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1 text-rose-700">
                      <AlertTriangle className="w-3.5 h-3.5" /> Report Overdue by {inspection.delayHours} Hours
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                      Level 2 Escalation
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Statutory 48h deadline lapsed. AICTE Regional Director notified.
                  </p>
                </div>
              )}

              {/* Card Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {inspection.isOverdue ? (
                  <button
                    onClick={() => handleEscalationNotice(inspection)}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                  >
                    <Send className="w-3 h-3" /> Issue Escalation Notice
                  </button>
                ) : (
                  <button
                    onClick={() => handleActionClick(`View inspection docket for ${inspection.applicationNumber}`)}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
                  >
                    View Committee Docket
                  </button>
                )}
                {inspection.reportUploadedDate && (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Report Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
