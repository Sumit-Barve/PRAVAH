import React, { useState, useEffect, useCallback } from 'react';
import { RegulatoryRule } from '@saksham/shared';
import { fetchRegulatoryRules } from '../services/rulesService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AdminRulesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRulesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRegulatoryRules();
      setRules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load regulatory rules from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRulesData();
  }, [loadRulesData]);

  const filteredRules = rules.filter((r) => {
    const matchesCat = selectedCategory === 'ALL' || r.applicationCategory === selectedCategory;
    const matchesVer = selectedVerification === 'ALL' || r.verificationStatus === selectedVerification;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      r.ruleCode.toLowerCase().includes(q) ||
      r.requirementTitle.toLowerCase().includes(q) ||
      r.sourceTitle.toLowerCase().includes(q) ||
      r.chapterSectionPage.toLowerCase().includes(q);
    return matchesCat && matchesVer && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Statutory Register Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-gov-navy-800" />
            Regulatory Rules Engine & Versioned Statutory Register
          </h3>
          <p className="text-slate-600 mt-1">
            Official citations derived directly from the AICTE Approval Process Handbook (APH) 2024–25 to 2026–27. Business rules, turnaround SLAs, and escalation thresholds are dynamically parameter-controlled to eliminate hard-coded unverified regulatory assumptions. PRAVAH assists the approval workflow and does not independently grant statutory approvals.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-gov-navy-50 text-gov-navy-900 border border-gov-navy-200 rounded font-semibold text-xs">
            APH 2024–27 Edition
          </span>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-300 rounded py-1 px-2 text-xs focus:ring-1 focus:ring-gov-navy-700"
          >
            <option value="ALL">All Application Categories</option>
            <option value="NEW_INSTITUTE">New Technical Institution</option>
            <option value="EOA_EXISTING">Extension of Approval (EoA)</option>
            <option value="INTAKE_INCREASE">Increase in Approved Intake</option>
            <option value="SUPERNUMERARY_SEATS">Supernumerary Seats</option>
            <option value="CHANGE_OF_SITE">Change of Site</option>
          </select>

          <select
            value={selectedVerification}
            onChange={(e) => setSelectedVerification(e.target.value)}
            className="border border-slate-300 rounded py-1 px-2 text-xs focus:ring-1 focus:ring-gov-navy-700"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="VERIFIED">Verified (Official Published Handbook)</option>
            <option value="PENDING_VERIFICATION">Pending Verification (Unverified Draft)</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search rule or citation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded py-1.5 pl-7 pr-3 focus:ring-1 focus:ring-gov-navy-700"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading regulatory rules and verification matrices from PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRulesData} />
      ) : filteredRules.length === 0 ? (
        <EmptyState
          title="No Rules Found"
          message="No regulatory rules match the specified category or query."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rule Code</th>
                  <th>Application Category</th>
                  <th>Requirement or Transition</th>
                  <th>Responsible Role</th>
                  <th>Statutory Citation (APH)</th>
                  <th>SLA & Escalation</th>
                  <th>Verification Status</th>
                  <th>Operational Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-xs font-bold text-gov-navy-900">
                      {rule.ruleCode}
                    </td>
                    <td className="text-xs font-medium text-slate-800">
                      {rule.applicationCategory.replace(/_/g, ' ')}
                    </td>
                    <td>
                      <div className="font-bold text-xs text-slate-900">{rule.requirementTitle}</div>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {rule.responsibleRole.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs font-medium text-slate-900">{rule.sourceTitle}</div>
                      <div className="text-[11px] text-gov-navy-800 font-mono">
                        {rule.chapterSectionPage}
                      </div>
                      <div className="text-[10px] text-slate-400">Ver: {rule.sourceVersion}</div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-800">SLA: {rule.slaDays}d</div>
                      <div className="text-[11px] text-slate-500">Alert: {rule.escalationIntervalDays}d</div>
                    </td>
                    <td>
                      {rule.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Pending Verification
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600 max-w-[220px]">
                      {rule.notes}
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
