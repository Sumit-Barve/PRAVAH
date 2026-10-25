import React, { useState, useEffect } from 'react';
import { Application, DeficiencyNotice, ApplicationDocument } from '@saksham/shared';
import { StageBadge, PriorityBadge } from './StatusBadge';
import { apiGet, apiPost } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Building2,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Download,
  Plus,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface ApplicationDetailDrawerProps {
  application: Application | null;
  onClose: () => void;
  onReviewScrutiny?: (application: Application) => void;
}

export const ApplicationDetailDrawer: React.FC<ApplicationDetailDrawerProps> = ({
  application,
  onClose,
  onReviewScrutiny,
}) => {
  const { currentUser } = useAuth();

  const [docketNotice, setDocketNotice] = useState(false);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [deficiencyNotices, setDeficiencyNotices] = useState<DeficiencyNotice[]>([]);
  const [isDraftingDeficiency, setIsDraftingDeficiency] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParam, setNewParam] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (application?.id) {
      // Fetch full application record with relations from database
      apiGet<{ success: boolean; data: any }>(`/applications/${application.id}`)
        .then((res) => {
          if (res.data) {
            setDocuments(res.data.documents || []);
            setDeficiencyNotices(res.data.deficiencyNotices || []);
          }
        })
        .catch(() => {});
    }
  }, [application?.id]);

  if (!application) return null;

  const canManageDeficiencies =
    currentUser?.role === 'SCRUTINY_OFFICER' ||
    currentUser?.role === 'REGIONAL_OFFICER' ||
    currentUser?.role === 'SYSTEM_ADMIN';

  const handleCreateDeficiency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      const res = await apiPost<{ success: boolean; data: DeficiencyNotice }>(
        `/applications/${application.id}/deficiencies`,
        {
          title: newTitle.trim(),
          parameterName: newParam.trim() || 'General Scrutiny Compliance',
          description: newDesc.trim(),
        }
      );

      setDeficiencyNotices((prev) => [res.data, ...prev]);
      setIsDraftingDeficiency(false);
      setNewTitle('');
      setNewParam('');
      setNewDesc('');
      setActionSuccess('Draft deficiency created.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create deficiency notice.');
    }
  };

  const handleReleaseNotice = async (noticeId: string) => {
    try {
      const res = await apiPost<{ success: boolean; data: DeficiencyNotice }>(
        `/applications/${application.id}/deficiencies/${noticeId}/release`,
        {}
      );

      setDeficiencyNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? res.data : n))
      );
      setActionSuccess('Deficiency notice formally released to institution.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to release deficiency notice.');
    }
  };

  const handleReviewNotice = async (noticeId: string, status: 'RESOLVED_SATISFIED' | 'REJECTED_UNSATISFACTORY') => {
    const reviewNotes = prompt(
      status === 'RESOLVED_SATISFIED'
        ? 'Enter officer verification remarks confirming satisfaction:'
        : 'Enter rejection notes explaining why clarification is inadequate:'
    );

    if (!reviewNotes) return;

    try {
      const res = await apiPost<{ success: boolean; data: DeficiencyNotice }>(
        `/applications/${application.id}/deficiencies/${noticeId}/review`,
        { status, reviewNotes }
      );

      setDeficiencyNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? res.data : n))
      );
      setActionSuccess(`Finding marked ${status === 'RESOLVED_SATISFIED' ? 'Resolved' : 'Rejected'}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to evaluate deficiency response.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end"
    >
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="bg-gov-navy-900 text-white p-5 flex items-start justify-between border-b border-gov-navy-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-gov-saffron-500">
                Application File
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="font-mono text-xs text-slate-300">
                {application.applicationNumber}
              </span>
            </div>
            <h2 id="drawer-title" className="text-lg font-bold text-white mt-1 leading-snug">
              {application.instituteName}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              PID: <span className="font-mono font-medium">{application.permanentInstituteId}</span> • Trust: {application.trustName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-gov-navy-800 transition"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Status & Priority Ribbon */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-700 block uppercase mb-1">
                Current Approval Stage
              </span>
              <StageBadge stage={application.currentStage} className="text-sm px-2.5 py-1" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 block uppercase mb-1">
                Pendency Priority
              </span>
              <PriorityBadge priority={application.priority} className="text-sm px-2.5 py-1" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 block uppercase mb-1">
                Stage Ageing
              </span>
              <span className="font-semibold text-slate-900 font-mono">
                {application.stageAgeingDays} Days
              </span>
              <span className="text-xs text-slate-700 ml-1">({application.totalAgeingDays} total)</span>
            </div>
          </div>

          {/* Institutional Demographics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-gov-navy-700" /> Statutory Classification
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">Approval Category:</span>
                <span className="font-semibold text-slate-900">{application.category.replace(/_/g, ' ')}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">Institution Sector:</span>
                <span className="font-semibold text-slate-900">{application.institutionType.replace(/_/g, ' ')}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">Regional Office:</span>
                <span className="font-semibold text-slate-900">{application.region.replace(/_/g, ' ')} ({application.state})</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">Campus Land:</span>
                <span className="font-semibold text-slate-900 font-mono">{application.landAreaAcres} Acres</span>
              </div>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gov-navy-700" /> Uploaded Statutory Documents ({documents.length})
            </h4>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-500">No documents uploaded for this application record.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={`/api/institution/applications/${application.id}/documents/${doc.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center space-x-1 font-bold text-[10px]"
                    >
                      <Download className="w-3 h-3 text-blue-600" />
                      <span>View</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deficiencies Section with Drafting & Review */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Deficiency Notices & Clarifications ({deficiencyNotices.length})
              </h4>
              {canManageDeficiencies && (
                <button
                  type="button"
                  onClick={() => setIsDraftingDeficiency(!isDraftingDeficiency)}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Draft Notice</span>
                </button>
              )}
            </div>

            {/* Draft Deficiency Form */}
            {isDraftingDeficiency && (
              <form onSubmit={handleCreateDeficiency} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 text-xs">
                <div className="font-bold text-amber-950">Draft Scrutiny Deficiency Notice</div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">Notice Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Land Title Lease Period Discrepancy"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">Norm Parameter *</label>
                  <input
                    type="text"
                    value={newParam}
                    onChange={(e) => setNewParam(e.target.value)}
                    placeholder="e.g. Land Area / APH Clause 1.4"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">Committee Deficiency Finding *</label>
                  <textarea
                    rows={2}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Specify the regulatory deficiency observed during scrutiny..."
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDraftingDeficiency(false)}
                    className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-gov-navy-950 text-white font-bold text-xs"
                  >
                    Save Internal Draft
                  </button>
                </div>
              </form>
            )}

            {deficiencyNotices.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Zero deficiencies active on this application file.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {deficiencyNotices.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-gov-navy-950">{n.noticeNumber}</span>
                          <span className="font-bold text-slate-900">{n.title}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{n.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {n.isReleased ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Released to Institution
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Internal Draft
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Institution Response View */}
                    {n.institutionResponse && (
                      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900">
                        <span className="font-bold">Institution Clarification Response:</span>
                        <p className="mt-0.5">{n.institutionResponse}</p>
                        {n.responseDocumentRef && (
                          <div className="text-[11px] text-blue-700 mt-1">
                            Ref: <strong>{n.responseDocumentRef}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Officer Review Notes */}
                    {n.officerReviewNotes && (
                      <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                        <span className="font-bold">Review Evaluation:</span> {n.officerReviewNotes}
                      </div>
                    )}

                    {/* Officer Actions */}
                    {canManageDeficiencies && (
                      <div className="flex justify-end space-x-2 pt-1 border-t border-slate-200">
                        {!n.isReleased && (
                          <button
                            type="button"
                            onClick={() => handleReleaseNotice(n.id)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px]"
                          >
                            Release Notice to Institution
                          </button>
                        )}

                        {n.isReleased && n.status === 'AWAITING_OFFICER_REVIEW' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReviewNotice(n.id, 'RESOLVED_SATISFIED')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              Satisfy & Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewNotice(n.id, 'REJECTED_UNSATISFACTORY')}
                              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                            >
                              Reject Response
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission and Audit Metadata */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-700" /> Submission Date:
              </span>
              <span className="font-medium text-slate-800">{new Date(application.submissionDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-700" /> Last System Update:
              </span>
              <span className="font-medium text-slate-800">{new Date(application.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onReviewScrutiny) {
                  onReviewScrutiny(application);
                  onClose();
                }
              }}
              className="px-4 py-2 bg-gov-navy-900 text-white hover:bg-gov-navy-800 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Full Scrutiny Workbench
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
