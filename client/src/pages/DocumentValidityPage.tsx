import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentValidityItem,
  DocumentType,
} from '@saksham/shared';
import { fetchDocumentValidityItems } from '../services/documentService';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateFeedback';
import { ValidityBadge } from '../components/ui/StatusBadge';
import {
  Clock,
  Building,
  Flame,
  Award,
  Landmark,
  Search,
} from 'lucide-react';

export const DocumentValidityPage: React.FC = () => {
  const [selectedDocType, setSelectedDocType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentValidityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadDocumentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDocumentValidityItems();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load document validity records from PostgreSQL service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocumentData();
  }, [loadDocumentData]);

  const filteredDocs = documents.filter((doc) => {
    const matchesType = selectedDocType === 'ALL' || doc.documentType === selectedDocType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      doc.instituteName.toLowerCase().includes(q) ||
      doc.documentIdentifier.toLowerCase().includes(q) ||
      doc.issuingAuthority.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const getDocTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'FIRE_SAFETY_NOC':
        return <Flame className="w-4 h-4 text-orange-600" />;
      case 'LAND_LEASE':
        return <Building className="w-4 h-4 text-gov-navy-700" />;
      case 'NBA_ACCREDITATION':
        return <Award className="w-4 h-4 text-blue-600" />;
      case 'BUILDING_OCCUPANCY':
        return <Building className="w-4 h-4 text-emerald-600" />;
      case 'FDR_ENDOWMENT':
        return <Landmark className="w-4 h-4 text-purple-600" />;
    }
  };

  const handleInspect = (doc: DocumentValidityItem) => {
    setNoticeMessage(`Notice: Full document certificate preview for ${doc.documentIdentifier} (${doc.documentType}) is staged for Phase 3 document repository.`);
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

      {/* Top Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gov-navy-800" />
            Statutory Document Expiry & Land Lease Validity Auditing
          </h3>
          <p className="text-slate-600 mt-1">
            Proactive lifecycle monitoring for mandatory institutional instruments. Per AICTE APH norms, land leases must maintain valid tenure &ge; 30 years, and Fire NOCs require perpetual active certification.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-900 font-semibold text-xs">
            180d Early Warning
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-semibold text-xs">
            90d Critical Escalation
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedDocType('ALL')}
            className={`px-3 py-1.5 rounded font-semibold ${
              selectedDocType === 'ALL'
                ? 'bg-gov-navy-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Instruments ({documents.length})
          </button>
          <button
            onClick={() => setSelectedDocType('LAND_LEASE')}
            className={`px-3 py-1.5 rounded font-semibold ${
              selectedDocType === 'LAND_LEASE'
                ? 'bg-gov-navy-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Land Leases
          </button>
          <button
            onClick={() => setSelectedDocType('FIRE_SAFETY_NOC')}
            className={`px-3 py-1.5 rounded font-semibold ${
              selectedDocType === 'FIRE_SAFETY_NOC'
                ? 'bg-gov-navy-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Fire NOCs
          </button>
          <button
            onClick={() => setSelectedDocType('NBA_ACCREDITATION')}
            className={`px-3 py-1.5 rounded font-semibold ${
              selectedDocType === 'NBA_ACCREDITATION'
                ? 'bg-gov-navy-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            NBA Accreditations
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search document or institute..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded py-1.5 pl-7 pr-3 focus:ring-1 focus:ring-gov-navy-700"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Querying live document instruments from PRAVAH PostgreSQL service..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadDocumentData} />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          message="No statutory documents match the specified filter or query."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document Type & Identifier</th>
                  <th>Institution Name</th>
                  <th>Issuing Authority</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Days to Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center space-x-2">
                        {getDocTypeIcon(doc.documentType)}
                        <span className="font-bold text-xs text-slate-900">
                          {doc.documentType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                        {doc.documentIdentifier}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-900 max-w-[200px] truncate">
                        {doc.instituteName}
                      </div>
                    </td>
                    <td className="text-xs text-slate-600 max-w-[180px] truncate">
                      {doc.issuingAuthority}
                    </td>
                    <td className="text-xs text-slate-600">
                      {new Date(doc.issueDate).toLocaleDateString()}
                    </td>
                    <td className="text-xs font-bold text-slate-900">
                      {new Date(doc.expiryDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`font-mono text-xs font-bold ${
                          doc.daysToExpiry < 0
                            ? 'text-rose-600'
                            : doc.daysToExpiry <= 60
                            ? 'text-orange-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {doc.daysToExpiry < 0
                          ? `Expired (${Math.abs(doc.daysToExpiry)}d)`
                          : `${doc.daysToExpiry} Days`}
                      </span>
                    </td>
                    <td>
                      <ValidityBadge status={doc.validityStatus} days={doc.daysToExpiry} />
                    </td>
                    <td>
                      <button
                        onClick={() => handleInspect(doc)}
                        className="px-2.5 py-1 text-xs font-semibold text-gov-navy-800 bg-gov-navy-50 hover:bg-gov-navy-100 rounded border border-gov-navy-200"
                      >
                        Inspect File
                      </button>
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
