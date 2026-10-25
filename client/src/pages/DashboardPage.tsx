import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Application, DashboardMetrics, AuditLogEntry, Region } from '@saksham/shared';
import { fetchDashboardMetrics } from '../services/metricsService';
import { fetchApplications } from '../services/applicationService';
import { fetchAuditLogs } from '../services/auditService';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { StatCard } from '../components/ui/StatCard';
import { StageBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { ApplicationDetailDrawer } from '../components/ui/ApplicationDetailDrawer';
import {
  FileText,
  Clock,
  GitPullRequest,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  Building,
  ArrowRight,
  BookOpen,
  Scale,
  Sparkles,
} from 'lucide-react';
import { StatutoryCalendarStepper } from '../components/features/StatutoryCalendarStepper';
import { RegionalJurisdictionHub } from '../components/features/RegionalJurisdictionHub';
import { ScrutinyEvaluationModal } from '../components/features/ScrutinyEvaluationModal';
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>('ALL');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [evaluatingApplication, setEvaluatingApplication] = useState<Application | null>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canViewAudit = currentUser?.role === 'MEMBER_SECRETARY' || currentUser?.role === 'SYSTEM_ADMIN';

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, appsRes, auditLogs] = await Promise.all([
        fetchDashboardMetrics(),
        fetchApplications({ limit: 100 }),
        canViewAudit ? fetchAuditLogs({ limit: 4 }).catch(() => []) : Promise.resolve([]),
      ]);
      setMetrics(metricsData);
      setApplications(appsRes.data);
      setRecentAuditLogs(auditLogs);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to PRAVAH PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, [canViewAudit]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        searchQuery === '' ||
        app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.instituteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage =
        selectedStageFilter === 'ALL' ||
        (selectedStageFilter === 'SCRUTINY' && (app.currentStage === 'SCRUTINY' || app.currentStage === 'RE_SCRUTINY')) ||
        (selectedStageFilter === 'EVC' && (app.currentStage === 'EVC_SCHEDULED' || app.currentStage === 'EVC_COMPLETED')) ||
        (selectedStageFilter === 'OVERDUE' && (app.priority === 'CRITICAL_OVERDUE' || app.stageAgeingDays > 7)) ||
        app.currentStage === selectedStageFilter;

      const matchesRegion = selectedRegion === 'ALL' || app.region === selectedRegion;

      return matchesSearch && matchesStage && matchesRegion;
    });
  }, [applications, searchQuery, selectedStageFilter, selectedRegion]);

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

  return (
    <div className="space-y-7 animate-in fade-in duration-150">
      {error && (
        <ErrorState message={error} onRetry={loadDashboardData} />
      )}

      {/* 1. Official Government Hero Banner (like Image 2 & Image 3) */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#071833] via-[#0A254D] to-[#123B75] text-white p-6 sm:p-8 shadow-lg border border-gov-navy-800">
        {/* Subtle geometric background motif */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" fill="none" stroke="#F59E0B" strokeWidth="4" />
            <polygon points="100,35 155,67 155,133 100,165 45,133 45,67" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AICTE Approval Cycle 2026–2027</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Integrated AICTE Approval Workflow Automation & Compliance System
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
            Intelligent Scrutiny • Automated Workflows • Transparent Compliance. Empowering AICTE Scrutiny Officers, Regional Directors, and Expert Visit Committees across all 7 regional jurisdictions.
          </p>

          {/* Quick CTA Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/workflow-queue')}
              className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md text-xs font-bold shadow flex items-center gap-2 transition"
            >
              <span>Access Scrutiny Queue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/applications')}
              className="px-4 py-2 bg-[#0A1B38] hover:bg-[#071224] text-white border border-slate-500 rounded-md text-xs font-bold shadow flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Applications Master Register</span>
            </button>

            <a
              href="https://www.aicte.gov.in/sites/default/files/approval/APH%20Final.pdf"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-100 rounded-md text-xs font-semibold backdrop-blur-sm border border-white/20 flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>APH 2024–27 Handbook (PDF)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Quick Access Services Grid (Navy Cards with Gold Accents like Image 2) */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-saffron-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            QUICK ACCESS
          </span>
          <h2 className="text-sm font-bold text-slate-800">
            Core Statutory Workflow Desks & Processing Centers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Scrutiny */}
          <div
            onClick={() => navigate('/workflow-queue')}
            className="group cursor-pointer rounded-lg bg-[#0F294D] hover:bg-[#0A1B38] text-white p-5 shadow-sm border border-[#1A4275] transition-all duration-150 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3">
                <GitPullRequest className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                Scrutiny & Deficiency Desk
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Verify institutional compliance against APH Chapter I/II/III norms. 7-day SLA monitoring.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1A4275] flex items-center justify-between text-xs text-amber-300 font-semibold">
              <span>{safeMetrics.pendingScrutinyCount} Files in Queue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: EVC Inspections */}
          <div
            onClick={() => navigate('/evc')}
            className="group cursor-pointer rounded-lg bg-[#0F294D] hover:bg-[#0A1B38] text-white p-5 shadow-sm border border-[#1A4275] transition-all duration-150 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-cyan-400/20 text-cyan-300 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                EVC Committee Logistics
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Constitute 3-member expert visit committees and enforce 48-hour report submission deadline.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1A4275] flex items-center justify-between text-xs text-cyan-300 font-semibold">
              <span>{safeMetrics.evcScheduledCount} Active Inspections</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Compliance & Undertakings */}
          <div
            onClick={() => navigate('/compliance')}
            className="group cursor-pointer rounded-lg bg-[#0F294D] hover:bg-[#0A1B38] text-white p-5 shadow-sm border border-[#1A4275] transition-all duration-150 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                Institutional Undertakings
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Track time-bound conditional approvals (30, 60, 90-day grace) with multi-tier show-cause notices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1A4275] flex items-center justify-between text-xs text-emerald-300 font-semibold">
              <span>{safeMetrics.complianceDueSoonCount} Due Soon</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Document Validity */}
          <div
            onClick={() => navigate('/document-validity')}
            className="group cursor-pointer rounded-lg bg-[#0F294D] hover:bg-[#0A1B38] text-white p-5 shadow-sm border border-[#1A4275] transition-all duration-150 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-rose-400/20 text-rose-300 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-rose-300 transition">
                Statutory Document Validity
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Automated expiry tracking for 30-year land leases, fire NOCs, and NBA accreditations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1A4275] flex items-center justify-between text-xs text-rose-300 font-semibold">
              <span>{safeMetrics.documentValidityExpiredCount} Lapsed / Overdue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Supreme Court Statutory Approval Process Calendar Stepper */}
      <StatutoryCalendarStepper />

      {/* 4. Statutory SLA Escalation Strip */}
      {safeMetrics.criticalAlertCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-600 rounded-r-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-200 rounded-md text-amber-900 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <span className="font-extrabold text-amber-950 uppercase tracking-wide">
                Statutory Pendency Escalation Advisory:
              </span>{' '}
              <span className="text-amber-900 leading-relaxed">
                {safeMetrics.overdueTasksCount} overdue scrutiny tasks, {safeMetrics.evcOverdueReportsCount} overdue EVC report(s), and {safeMetrics.documentValidityExpiredCount} expired statutory document(s) require intervention.
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedStageFilter('OVERDUE')}
            className="px-3.5 py-1.5 bg-amber-800 text-white hover:bg-amber-900 rounded font-bold text-xs whitespace-nowrap shadow-sm"
          >
            Filter Overdue Queue
          </button>
        </div>
      )}

      {/* 4. Stage Progression & Workload Pipeline Strip */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-gov-navy-800" />
              Stage-Wise Application Pipeline & Workload Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Real-time distribution of institutional applications across statutory evaluation milestones (APH 2024–27)
            </p>
          </div>
          <button
            onClick={() => navigate('/workflow-queue')}
            className="text-xs text-gov-navy-900 font-bold hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Stage Pendency Engine</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-gov-saffron-600" />
          </button>
        </div>

        {/* Stage Progress Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div
            onClick={() => setSelectedStageFilter('SUBMITTED')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStageFilter === 'SUBMITTED' ? 'border-gov-navy-800 bg-gov-navy-50 ring-2 ring-gov-navy-600' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">1. Ingestion</span>
            <span className="text-xl font-bold text-slate-900 block mt-1">{safeMetrics.stageDistribution.SUBMITTED}</span>
            <span className="text-[10px] text-slate-500">Submitted</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('SCRUTINY')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStageFilter === 'SCRUTINY' ? 'border-gov-navy-800 bg-gov-navy-50 ring-2 ring-gov-navy-600' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-blue-700 block uppercase">2. Scrutiny</span>
            <span className="text-xl font-bold text-blue-900 block mt-1">{safeMetrics.stageDistribution.SCRUTINY}</span>
            <span className="text-[10px] text-slate-500">Initial Docs</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('RE_SCRUTINY')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStageFilter === 'RE_SCRUTINY' ? 'border-gov-navy-800 bg-gov-navy-50 ring-2 ring-gov-navy-600' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-amber-700 block uppercase">3. Re-Scrutiny</span>
            <span className="text-xl font-bold text-amber-800 block mt-1">{safeMetrics.stageDistribution.RE_SCRUTINY}</span>
            <span className="text-[10px] text-slate-500">Rectifications</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('EVC')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStageFilter === 'EVC' ? 'border-gov-navy-800 bg-gov-navy-50 ring-2 ring-gov-navy-600' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-cyan-700 block uppercase">4. EVC Visits</span>
            <span className="text-xl font-bold text-cyan-900 block mt-1">
              {safeMetrics.stageDistribution.EVC_SCHEDULED + safeMetrics.stageDistribution.EVC_COMPLETED}
            </span>
            <span className="text-[10px] text-slate-500">Inspections</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('SHC_HEARING')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStageFilter === 'SHC_HEARING' ? 'border-gov-navy-800 bg-gov-navy-50 ring-2 ring-gov-navy-600' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-purple-700 block uppercase">5. Hearing (SHC)</span>
            <span className="text-xl font-bold text-purple-900 block mt-1">{safeMetrics.stageDistribution.SHC_HEARING}</span>
            <span className="text-[10px] text-slate-500">Contested</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('SAC_APPEAL')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStageFilter === 'SAC_APPEAL' ? 'border-gov-navy-800 bg-gov-navy-50 ring-2 ring-gov-navy-600' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-indigo-700 block uppercase">6. Appeals (SAC)</span>
            <span className="text-xl font-bold text-indigo-900 block mt-1">{safeMetrics.stageDistribution.SAC_APPEAL}</span>
            <span className="text-[10px] text-slate-500">Statutory Bench</span>
          </div>

          <div
            onClick={() => setSelectedStageFilter('APPROVED_CONDITIONAL')}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedStageFilter === 'APPROVED_CONDITIONAL' ? 'border-gov-navy-800 bg-gov-navy-50 ring-2 ring-gov-navy-600' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-emerald-700 block uppercase">7. Approvals</span>
            <span className="text-xl font-bold text-emerald-800 block mt-1">
              {safeMetrics.stageDistribution.APPROVED_CONDITIONAL + safeMetrics.stageDistribution.APPROVAL_GRANTED}
            </span>
            <span className="text-[10px] text-slate-500">Conditional / Full</span>
          </div>
        </div>
      </div>

      {/* 5. AICTE Regional Jurisdictions Hub (Interactive 8 Regional Offices) */}
      <RegionalJurisdictionHub
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
        applications={applications}
      />

      {/* 6. Main Dual Operational Workload Grid (3 Cols Table + 1 Col Action Side Panel) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column (3 Cols): Expanded Full-Width Workload Register Table */}
        <div className="xl:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-slate-200 space-y-3 bg-[#FAFBFD]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gov-navy-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gov-navy-800" />
                  Active Applications Master Workload Register
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {filteredApplications.length} of {safeMetrics.totalApplications} records in active processing
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedStageFilter('ALL')}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    selectedStageFilter === 'ALL'
                      ? 'bg-gov-navy-900 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  All ({safeMetrics.totalApplications})
                </button>
                <button
                  onClick={() => setSelectedStageFilter('SCRUTINY')}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    selectedStageFilter === 'SCRUTINY'
                      ? 'bg-blue-800 text-white'
                      : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  Scrutiny ({safeMetrics.pendingScrutinyCount})
                </button>
                <button
                  onClick={() => setSelectedStageFilter('EVC')}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    selectedStageFilter === 'EVC'
                      ? 'bg-cyan-800 text-white'
                      : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
                  }`}
                >
                  EVC ({safeMetrics.evcScheduledCount})
                </button>
                <button
                  onClick={() => setSelectedStageFilter('OVERDUE')}
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    selectedStageFilter === 'OVERDUE'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  Overdue ({safeMetrics.overdueTasksCount})
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search register by Application ID, Institute Name, Region, or State..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-md py-2 pl-9 pr-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-navy-700 bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Application Number</th>
                  <th>Institution Name & Region</th>
                  <th>Category</th>
                  <th>Current Stage</th>
                  <th>Priority</th>
                  <th>Desk Ageing</th>
                  <th>Assigned Officer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="font-mono text-xs font-bold text-gov-navy-950">
                        {app.applicationNumber}
                        <div className="text-[10px] text-slate-500 font-mono">PID: {app.permanentInstituteId}</div>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 text-xs truncate max-w-[280px]">
                          {app.instituteName}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {app.region} • {app.state}
                        </div>
                      </td>
                      <td className="text-xs text-slate-700 font-medium">
                        {app.category.replace(/_/g, ' ')}
                      </td>
                      <td>
                        <StageBadge stage={app.currentStage} />
                      </td>
                      <td>
                        <PriorityBadge priority={app.priority} />
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {app.stageAgeingDays}d
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">({app.totalAgeingDays}d)</span>
                      </td>
                      <td className="text-xs text-slate-700">
                        {app.assignedOfficer}
                      </td>
                      <td>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="px-2.5 py-1 text-xs font-bold text-gov-navy-900 bg-gov-navy-50 hover:bg-gov-navy-100 rounded border border-gov-navy-300 transition"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => setEvaluatingApplication(app)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-gov-navy-900 hover:bg-gov-navy-800 rounded shadow-sm transition"
                          >
                            Evaluate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-xs text-slate-500">
                      No applications match the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-700">
            <span>Average Application Ageing: <strong className="text-slate-900">{safeMetrics.averageAgeingDays} Days</strong></span>
            <button
              onClick={() => navigate('/applications')}
              className="font-bold text-gov-navy-900 hover:underline flex items-center gap-1"
            >
              Open Full Master Register &rarr;
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): Priority Queues & Recent Forensic Activity */}
        <div className="space-y-6">
          {/* Quick Action Queue Shortcuts */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Action Escalations
            </h3>
            <div className="space-y-2">
              <div
                onClick={() => navigate('/evc')}
                className="p-3 rounded-lg border border-slate-200 hover:border-gov-navy-700 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">EVC Inspection Overdue Queue</p>
                  <p className="text-[11px] text-rose-700 font-medium">1 committee report exceeding 48h limit</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => navigate('/compliance')}
                className="p-3 rounded-lg border border-slate-200 hover:border-gov-navy-700 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">Time-Bound Undertakings</p>
                  <p className="text-[11px] text-amber-700 font-medium">2 compliance deadlines due soon</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => navigate('/document-validity')}
                className="p-3 rounded-lg border border-slate-200 hover:border-gov-navy-700 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">Document Expiry Early Warning</p>
                  <p className="text-[11px] text-slate-500">30-year land leases & Fire Safety NOCs</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Audit Activity Log (Member Secretary & System Admin only) OR Jurisdiction Card */}
          {canViewAudit ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Regulatory Activity
                </h3>
                <button
                  onClick={() => navigate('/audit')}
                  className="text-[11px] text-gov-navy-800 font-bold hover:underline"
                >
                  Full Trail &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs space-y-2">
                {recentAuditLogs.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">No audit events recorded.</div>
                ) : (
                  recentAuditLogs.map((log) => (
                    <div key={log.id} className="pt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900">{log.actionTitle}</span>
                        <span className="font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{log.details}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700">{log.actorName}</span>
                        <span>•</span>
                        <span className="font-mono">{log.ipAddressMasked}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Officer Statutory Scope
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                  RBAC Active
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">Officer:</span>
                  <span className="font-bold text-slate-900">{currentUser?.fullName || currentUser?.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-gov-navy-900">{currentUser?.role?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">Jurisdiction:</span>
                  <span className="font-semibold text-gov-saffron-800">{currentUser?.region || 'National Scope'}</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                  System audit ledger is restricted to Member Secretary and System Admin per statutory separation of duties.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flyout Application Detail Drawer */}
      <ApplicationDetailDrawer
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onReviewScrutiny={(app) => setEvaluatingApplication(app)}
      />

      {/* Interactive Scrutiny Checklist Evaluation Modal */}
      <ScrutinyEvaluationModal
        application={evaluatingApplication}
        onClose={() => setEvaluatingApplication(null)}
      />
    </div>
  );
};
