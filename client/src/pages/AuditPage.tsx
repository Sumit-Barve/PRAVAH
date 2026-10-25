import React, { useState, useEffect, useCallback } from 'react';
import { AuditLogEntry } from '@saksham/shared';
import { fetchAuditLogs } from '../services/auditService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import {
  Lock,
  Search,
  ArrowRight,
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs({ limit: 100 });
      setAuditLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesEntity = selectedEntity === 'ALL' || log.entityType === selectedEntity;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      log.actionTitle.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q);
    return matchesEntity && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Integrity Notice */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-gov-navy-800" />
            Immutable Forensic Regulatory Audit Trail
          </h3>
          <p className="text-slate-600 mt-1">
            Every administrative intervention, checklist evaluation, committee dispatch, and stage progression is cryptographically signed and stored in append-only audit structures.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-semibold text-xs">
            Tamper-Evident
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="font-semibold text-slate-500">Filter Entity:</span>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="border border-slate-300 rounded py-1 px-2 text-xs focus:ring-1 focus:ring-gov-navy-700"
          >
            <option value="ALL">All Entities ({auditLogs.length})</option>
            <option value="APPLICATION">Application</option>
            <option value="EVC">EVC Inspection</option>
            <option value="COMPLIANCE">Compliance Item</option>
            <option value="RULE">Regulatory Rule</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search action, officer, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded py-1.5 pl-7 pr-3 focus:ring-1 focus:ring-gov-navy-700"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live tamper-evident audit ledger from PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAuditData} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No Audit Logs Found"
          message="No audit trail entries match your specified filter criteria."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp & IP</th>
                  <th>Authorized Actor</th>
                  <th>Action Code & Title</th>
                  <th>Entity Affected</th>
                  <th>Details & Rationale</th>
                  <th>State Transition</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="text-xs font-mono font-bold text-slate-900">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        IP: {log.ipAddressMasked}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-900">{log.actorName}</div>
                      <div className="text-[11px] text-gov-navy-800 font-mono">
                        {log.actorRole.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 block w-max mb-1">
                        {log.actionCode}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{log.actionTitle}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-semibold text-gov-navy-900">
                        {log.entityId}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{log.entityType}</span>
                    </td>
                    <td className="text-xs text-slate-600 max-w-[280px]">
                      {log.details}
                    </td>
                    <td>
                      {log.previousState && log.newState ? (
                        <div className="text-[11px] space-y-1">
                          <span className="text-slate-400 line-through block truncate max-w-[150px]">
                            {log.previousState}
                          </span>
                          <span className="text-emerald-700 font-semibold block flex items-center gap-1 truncate max-w-[150px]">
                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
                            {log.newState}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
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
