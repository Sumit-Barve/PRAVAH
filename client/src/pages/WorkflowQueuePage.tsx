import React, { useState, useEffect, useCallback } from 'react';
import { Application } from '@saksham/shared';
import { fetchApplications } from '../services/applicationService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { StageBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { ApplicationDetailDrawer } from '../components/ui/ApplicationDetailDrawer';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { ScrutinyEvaluationModal } from '../components/features/ScrutinyEvaluationModal';

export const WorkflowQueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SCRUTINY' | 'RE_SCRUTINY' | 'EVC_TRANSITIONS'>('SCRUTINY');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [evaluatingApplication, setEvaluatingApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadQueueData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApplications({ limit: 100 });
      setApplications(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflow queues from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  const scrutinyCount = applications.filter((a) => a.currentStage === 'SCRUTINY').length;
  const reScrutinyCount = applications.filter((a) => a.currentStage === 'RE_SCRUTINY').length;
  const evcTransitionsCount = applications.filter(
    (a) => a.currentStage === 'EVC_SCHEDULED' || a.currentStage === 'EVC_COMPLETED'
  ).length;

  const queueApplications = applications.filter((app) => {
    if (activeTab === 'SCRUTINY') return app.currentStage === 'SCRUTINY';
    if (activeTab === 'RE_SCRUTINY') return app.currentStage === 'RE_SCRUTINY';
    if (activeTab === 'EVC_TRANSITIONS')
      return app.currentStage === 'EVC_SCHEDULED' || app.currentStage === 'EVC_COMPLETED';
    return true;
  });

  const handleActionClick = (actionName: string, appNumber: string) => {
    setNoticeMessage(`Notice: Action "${actionName}" for ${appNumber} is staged for Phase 3 mutation engine. No mock mutation executed.`);
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

      {/* SLA Policy Advisory */}
      <div className="bg-[#0A1B38] text-white rounded-lg p-5 shadow-sm border border-gov-navy-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>AICTE Statutory Scrutiny SLA: Strict 7 Business Days Turnaround</span>
          </div>
          <p className="text-slate-200 text-xs leading-relaxed max-w-4xl">
            Per the AICTE Approval Process Handbook (APH 2024–27 Chapter I & II), applications assigned to Scrutiny Committee experts must complete preliminary document verification within 7 days. Files with unresolved deficiencies are automatically flagged for Re-Scrutiny or Hearing (SHC).
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-900/90 rounded border border-amber-400/40 text-amber-300 font-mono font-bold text-xs whitespace-nowrap shadow-inner">
          SLA Limit: 7 Days
        </div>
      </div>

      {/* Queue Tabs with Official Government Styling */}
      <div className="border-b-2 border-slate-300 flex space-x-3 bg-white px-4 pt-2 rounded-t-lg shadow-sm">
        <button
          onClick={() => setActiveTab('SCRUTINY')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 -mb-[2px] transition flex items-center space-x-2 ${
            activeTab === 'SCRUTINY'
              ? 'border-gov-navy-900 text-gov-navy-950 bg-slate-50 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Primary Scrutiny Queue</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
            {scrutinyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('RE_SCRUTINY')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 -mb-[2px] transition flex items-center space-x-2 ${
            activeTab === 'RE_SCRUTINY'
              ? 'border-gov-navy-900 text-gov-navy-950 bg-slate-50 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Re-Scrutiny (Rectifications)</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
            {reScrutinyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('EVC_TRANSITIONS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 -mb-[2px] transition flex items-center space-x-2 ${
            activeTab === 'EVC_TRANSITIONS'
              ? 'border-gov-navy-900 text-gov-navy-950 bg-slate-50 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>EVC Committee Transitions</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 text-[10px] font-bold">
            {evcTransitionsCount}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live applications from PRAVAH PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadQueueData} />
      ) : (
        <div className="space-y-4">
          {queueApplications.length > 0 ? (
            queueApplications.map((app) => {
              const isOverdue = app.stageAgeingDays > 7;
              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-lg border p-5 shadow-sm transition hover:shadow-md ${
                    isOverdue ? 'border-rose-300 ring-2 ring-rose-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Application Identification & Institute Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gov-navy-950 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                          {app.applicationNumber}
                        </span>
                        <span className="text-slate-300">|</span>
                        <StageBadge stage={app.currentStage} />
                        <PriorityBadge priority={app.priority} />
                        {isOverdue && (
                          <span className="px-2.5 py-0.5 rounded text-[11px] bg-rose-600 text-white font-extrabold animate-pulse">
                            SLA Breached ({app.stageAgeingDays}d)
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900">{app.instituteName}</h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span><strong>Trust:</strong> {app.trustName}</span>
                        <span>•</span>
                        <span><strong>Category:</strong> {app.category.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span><strong>Region:</strong> {app.region} ({app.state})</span>
                        <span>•</span>
                        <span><strong>Land:</strong> {app.landAreaAcres} Acres</span>
                      </div>
                    </div>

                    {/* Middle: Ageing & Officer Assignment */}
                    <div className="flex items-center space-x-6 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 flex-shrink-0">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Assigned Officer</span>
                        <span className="font-bold text-gov-navy-950">{app.assignedOfficer}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Desk Ageing</span>
                        <span className={`font-mono text-sm font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                          {app.stageAgeingDays} Days
                        </span>
                        <span className="text-[10px] text-slate-400 block">Total: {app.totalAgeingDays}d</span>
                      </div>
                    </div>

                    {/* Right: Operational Triggers */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="px-3.5 py-2 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 font-bold"
                      >
                        Inspect Docket
                      </button>
                      {app.currentStage === 'SCRUTINY' && (
                        <button
                          onClick={() => setEvaluatingApplication(app)}
                          className="px-4 py-2 bg-gov-navy-900 text-white hover:bg-gov-navy-800 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <FileCheck className="w-4 h-4 text-amber-300" /> Complete Checklist
                        </button>
                      )}
                      {app.currentStage === 'RE_SCRUTINY' && (
                        <button
                          onClick={() => setEvaluatingApplication(app)}
                          className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Verify Rectifications
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Deficiency Notice Bar if Flagged */}
                  {app.isDeficient && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-rose-50 p-3 rounded-md border border-rose-200">
                      <div className="flex items-center space-x-2 text-rose-800 font-semibold">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{app.deficiencyCount} deficiency item(s) recorded under faculty cadre / municipal NOC. Rectification window active under APH norms.</span>
                      </div>
                      <button
                        onClick={() => handleActionClick('Forward to SHC Bench', app.applicationNumber)}
                        className="font-bold text-rose-900 hover:underline flex items-center gap-1 whitespace-nowrap self-start sm:self-auto"
                      >
                        Forward to Hearing (SHC) &rarr;
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No Queue Applications"
              message="No application files currently match the selected workflow queue."
            />
          )}
        </div>
      )}

      {/* Flyout Drawer */}
      <ApplicationDetailDrawer
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />

      {/* Interactive Scrutiny Checklist Evaluation Modal */}
      <ScrutinyEvaluationModal
        application={evaluatingApplication}
        onClose={() => setEvaluatingApplication(null)}
      />
    </div>
  );
};

