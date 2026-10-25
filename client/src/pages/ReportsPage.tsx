import React, { useState, useEffect, useCallback } from 'react';
import { Application, DashboardMetrics } from '@saksham/shared';
import { fetchDashboardMetrics } from '../services/metricsService';
import { fetchApplications } from '../services/applicationService';
import { LoadingState, ErrorState } from '../components/common/StateFeedback';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Download,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, appsRes] = await Promise.all([
        fetchDashboardMetrics(),
        fetchApplications({ limit: 100 }),
      ]);
      setMetrics(metricsData);
      setApplications(appsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report analytics from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const safeMetrics: DashboardMetrics = metrics || {
    totalApplications: 0,
    stageDistribution: {
      SUBMITTED: 0,
      SCRUTINY: 0,
      RE_SCRUTINY: 0,
      EVC_SCHEDULED: 0,
      EVC_COMPLETED: 0,
      SHC_HEARING: 0,
      SAC_APPEAL: 0,
      APPROVED_CONDITIONAL: 0,
      APPROVAL_GRANTED: 0,
      REJECTED: 0,
    },
    categoryDistribution: {
      NEW_INSTITUTE: 0,
      EOA_EXISTING: 0,
      INTAKE_INCREASE: 0,
      SUPERNUMERARY_SEATS: 0,
      CHANGE_OF_SITE: 0,
      WOMEN_TO_COED: 0,
      CLOSURE: 0,
    },
    pendingScrutinyCount: 0,
    overdueTasksCount: 0,
    evcScheduledCount: 0,
    evcOverdueReportsCount: 0,
    complianceDueSoonCount: 0,
    complianceOverdueCount: 0,
    documentValidityExpiringSoonCount: 0,
    documentValidityExpiredCount: 0,
    averageAgeingDays: 0,
    criticalAlertCount: 0,
  };

  // Prepare regional breakdown data across all 8 AICTE Regional Offices
  const regionalData = [
    { region: 'NWRO', count: applications.filter((a) => a.region === 'NORTH_WEST').length },
    { region: 'WRO', count: applications.filter((a) => a.region === 'WESTERN').length },
    { region: 'SRO', count: applications.filter((a) => a.region === 'SOUTHERN').length },
    { region: 'SWRO', count: applications.filter((a) => a.region === 'SOUTH_WEST').length },
    { region: 'SCRO', count: applications.filter((a) => a.region === 'SOUTH_CENTRAL').length },
    { region: 'NRO', count: applications.filter((a) => a.region === 'NORTHERN').length },
    { region: 'CRO', count: applications.filter((a) => a.region === 'CENTRAL').length },
    { region: 'ERO', count: applications.filter((a) => a.region === 'EASTERN').length },
  ];

  // Prepare stage distribution data for Pie Chart
  const stagePieData = [
    { name: 'Scrutiny Desk', value: safeMetrics.stageDistribution.SCRUTINY + safeMetrics.stageDistribution.RE_SCRUTINY, color: '#2569C2' },
    { name: 'EVC Inspections', value: safeMetrics.stageDistribution.EVC_SCHEDULED + safeMetrics.stageDistribution.EVC_COMPLETED, color: '#06B6D4' },
    { name: 'Hearings (SHC/SAC)', value: safeMetrics.stageDistribution.SHC_HEARING + safeMetrics.stageDistribution.SAC_APPEAL, color: '#8B5CF6' },
    { name: 'Approvals Granted', value: safeMetrics.stageDistribution.APPROVED_CONDITIONAL + safeMetrics.stageDistribution.APPROVAL_GRANTED, color: '#10B981' },
    { name: 'Initial Ingestion', value: safeMetrics.stageDistribution.SUBMITTED, color: '#94A3B8' },
  ];

  const handleExportCSV = () => {
    const headers = ['Regional Office', 'Application Count'];
    const rows = regionalData.map((r) => [r.region, r.count.toString()]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PRAVAH_Regional_Workload_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Action Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-gov-navy-800" />
            Consolidated Regulatory Analytics & SLA Ageing
          </h3>
          <p className="text-slate-600 mt-1">
            Official operational reporting for AICTE Executive Committee and Regional Directors. Real-time metrics computed across the active 2026–27 approval cycle.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-gov-navy-900 text-white hover:bg-gov-navy-800 rounded font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export Workload Report (CSV)
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Aggregating live regulatory analytics from PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReportsData} />
      ) : (
        <>
          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Workload Distribution (Bar Chart) */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Regional Application Load (8 AICTE Offices)
                  </h4>
                  <p className="text-[11px] text-slate-500">Distribution across jurisdictional offices</p>
                </div>
                <span className="text-xs font-mono font-bold text-gov-navy-900">
                  Total: {safeMetrics.totalApplications}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" name="Applications" fill="#0F294D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Allocation Breakdown (Pie Chart) */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Stage-Wise Processing Pipeline
                  </h4>
                  <p className="text-[11px] text-slate-500">Proportion of files currently in evaluation</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700">Live Breakdown</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stagePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stagePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
                    />
                    <Legend
                      formatter={(value) => <span className="text-[11px] text-slate-700 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary KPI Matrix */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">
              Regulatory Bottleneck & Turnaround Diagnostics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Average Queue Ageing</span>
                <span className="text-lg font-bold text-slate-900">{safeMetrics.averageAgeingDays} Days</span>
                <span className="text-[11px] text-slate-600 block mt-0.5">APH Norm: &le; 30 Days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Overdue Scrutiny Tasks</span>
                <span className="text-lg font-bold text-rose-700">{safeMetrics.overdueTasksCount} Files</span>
                <span className="text-[11px] text-rose-600 block mt-0.5">Exceeding 7d SLA</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Delayed EVC Reports</span>
                <span className="text-lg font-bold text-amber-700">{safeMetrics.evcOverdueReportsCount} Reports</span>
                <span className="text-[11px] text-amber-600 block mt-0.5">Exceeding 48h limit</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Critical Document Risks</span>
                <span className="text-lg font-bold text-slate-900">{safeMetrics.documentValidityExpiredCount} Lapsed</span>
                <span className="text-[11px] text-slate-600 block mt-0.5">Immediate Notice Required</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
