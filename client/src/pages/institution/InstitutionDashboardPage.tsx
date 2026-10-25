import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getInstitutionApplications,
  getInstitutionDeficiencies,
  getInstitutionCompliance,
} from '../../services/institutionService';
import { Application, DeficiencyNotice, ComplianceItem } from '@saksham/shared';
import {
  Building2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Plus,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  FileCheck,
} from 'lucide-react';

export const InstitutionDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [deficiencies, setDeficiencies] = useState<DeficiencyNotice[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [apps, defs, comp] = await Promise.all([
          getInstitutionApplications(),
          getInstitutionDeficiencies(),
          getInstitutionCompliance(),
        ]);
        setApplications(apps);
        setDeficiencies(defs);
        setComplianceItems(comp);
      } catch (err) {
        console.error('Failed to load institution dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const draftApps = applications.filter((a) => a.isDraft);
  const submittedApps = applications.filter((a) => !a.isDraft);
  const pendingDeficiencies = deficiencies.filter((d) => d.status === 'ISSUED_PENDING_RESPONSE');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Institution Banner */}
      <div className="bg-gradient-to-r from-gov-navy-950 via-gov-navy-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-bold text-blue-300 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Permanent Institute ID: {currentUser?.permanentInstituteId || 'Pending Assignment'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {currentUser?.institutionName || 'Authorized Institution Profile'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Welcome, {currentUser?.fullName}. Manage AICTE Approval Process Handbook (APH 2024–27) regulatory applications, scrutiny observations, and compliance undertakings.
            </p>
          </div>

          <Link
            to="/institution/applications/new"
            className="flex-shrink-0 inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Application</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Active Applications</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{submittedApps.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Submitted to PRAVAH</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Draft Applications</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{draftApps.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">In-progress submission</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          pendingDeficiencies.length > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-amber-900">Action Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950">{pendingDeficiencies.length}</div>
          <div className="text-[11px] text-amber-800 mt-0.5">Deficiency clarifications</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Compliance Obligations</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{complianceItems.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Under review / active</div>
        </div>
      </div>

      {/* Outstanding Deficiency Notices Alert Banner */}
      {pendingDeficiencies.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-sm font-bold text-amber-950">
                AICTE Scrutiny Deficiency Notice Issued ({pendingDeficiencies.length} pending)
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                The scrutiny committee has identified non-compliances requiring clarification or documentation. Please respond before the stipulated deadline.
              </p>
              <div className="mt-3 space-y-2">
                {pendingDeficiencies.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-amber-900">{d.noticeNumber}</span>
                        <span className="text-xs font-bold text-slate-900">{d.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{d.description}</p>
                    </div>
                    <Link
                      to={`/institution/applications/${d.applicationId}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 flex-shrink-0"
                    >
                      <span>Respond & Upload Evidence</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Applications Register + Compliance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Applications</h2>
              <p className="text-xs text-slate-500">Processing stage and tracking timeline</p>
            </div>
            <Link
              to="/institution/applications"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No applications created yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Begin your AICTE Approval process for Extension of Approval (EoA), Intake Increase, or New Institute setup.
              </p>
              <Link
                to="/institution/applications/new"
                className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start Application</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gov-navy-950">
                        {app.applicationNumber}
                      </span>
                      {app.isDraft ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Draft (Unsubmitted)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {app.currentStage.replace(/_/g, ' ')}
                        </span>
                      )}
                      {app.isDeficient && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Deficiency Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      <span>Category: <strong>{app.category.replace(/_/g, ' ')}</strong></span>
                      <span className="mx-2">•</span>
                      <span>Cycle: {app.academicCycle || '2026-27'}</span>
                      <span className="mx-2">•</span>
                      <span>Intake: {app.requestedIntake} seats</span>
                    </div>
                  </div>

                  <Link
                    to={`/institution/applications/${app.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-gov-navy-900 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                  >
                    <span>{app.isDraft ? 'Continue Draft' : 'Track Application'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Regulatory Quick Links & Compliance */}
        <div className="space-y-6">
          {/* Statutory Handbook Guide */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider mb-2">
              AICTE Regulatory Reference
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              All applications are scrutinised in accordance with the official <strong>Approval Process Handbook (APH 2024–27)</strong>.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900">Chapter I: New Institutions</div>
                <div className="text-[11px] text-slate-500">Land Title (min 30yr lease), Occupancy, Fire NOC</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900">Chapter II: EoA & Intake Expansion</div>
                <div className="text-[11px] text-slate-500">NBA Accreditation (min 50% courses), Faculty Cadre Ratio</div>
              </div>
            </div>
          </div>

          {/* Compliance Undertakings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider">
                Active Undertakings
              </h3>
              <Link to="/institution/compliance" className="text-xs text-blue-600 hover:text-blue-800 font-bold">
                View All
              </Link>
            </div>
            {complianceItems.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No outstanding compliance undertakings.</p>
            ) : (
              <div className="space-y-2">
                {complianceItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-slate-900">{item.undertakingType}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
