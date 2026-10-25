import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getInstitutionApplication,
  respondToDeficiency,
} from '../../services/institutionService';
import { Application, DeficiencyNotice, ApplicationDocument, ComplianceItem } from '@saksham/shared';
import {
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Send,
  X,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

const WORKFLOW_STAGES = [
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'SCRUTINY', label: 'Scrutiny Committee' },
  { id: 'RE_SCRUTINY', label: 'Re-Scrutiny' },
  { id: 'EVC_SCHEDULED', label: 'EVC Inspection' },
  { id: 'SHC_HEARING', label: 'Standing Hearing' },
  { id: 'SAC_APPEAL', label: 'Standing Appellate' },
  { id: 'APPROVAL_GRANTED', label: 'Final Council Decision' },
];

export const InstitutionApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [application, setApplication] = useState<(Application & {
    documents: ApplicationDocument[];
    deficiencyNotices: DeficiencyNotice[];
    complianceItems: ComplianceItem[];
  }) | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeNoticeForResponse, setActiveNoticeForResponse] = useState<DeficiencyNotice | null>(null);
  const [responseText, setResponseText] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccessMsg, setResponseSuccessMsg] = useState<string | null>(null);

  const fetchApp = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getInstitutionApplication(id);
      setApplication(data);
    } catch (err) {
      console.error('Failed to load application details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const handleOpenResponseModal = (notice: DeficiencyNotice) => {
    setActiveNoticeForResponse(notice);
    setResponseText(notice.institutionResponse || '');
    setDocumentRef(notice.responseDocumentRef || '');
    setResponseSuccessMsg(null);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoticeForResponse || !responseText.trim()) return;

    setIsSubmittingResponse(true);
    try {
      await respondToDeficiency(activeNoticeForResponse.id, responseText.trim(), documentRef.trim() || undefined);
      setResponseSuccessMsg('Clarification response submitted successfully to the Scrutiny Committee.');
      await fetchApp();
      setTimeout(() => {
        setActiveNoticeForResponse(null);
        setResponseSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit deficiency response.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading application data...</div>;
  }

  if (!application) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-base font-bold text-slate-900">Application not found</h2>
        <Link to="/institution/applications" className="text-xs text-blue-600 underline mt-2 inline-block">
          Return to applications
        </Link>
      </div>
    );
  }

  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.id === application.currentStage);

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            to="/institution/applications"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Applications</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold font-mono text-gov-navy-950">
              {application.applicationNumber}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {application.isDraft ? 'Draft' : application.currentStage.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {application.isDraft && (
          <Link
            to={`/institution/applications/new?draftId=${application.id}`}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
          >
            Continue Editing Draft
          </Link>
        )}
      </div>

      {/* Stage Progress Tracker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Statutory Scrutiny Timeline & Processing State
        </h2>
        <div className="flex items-center justify-between min-w-[720px]">
          {WORKFLOW_STAGES.map((stg, i) => {
            const isPassed = currentStageIndex > i;
            const isCurrent = currentStageIndex === i || (currentStageIndex === -1 && i === 0);

            return (
              <React.Fragment key={stg.id}>
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-gov-navy-950 text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-2 max-w-[100px] leading-tight ${
                      isCurrent ? 'text-gov-navy-950 font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {stg.label}
                  </span>
                </div>
                {i < WORKFLOW_STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStageIndex > i ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Category & Cycle</span>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{application.category.replace(/_/g, ' ')}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">Cycle: {application.academicCycle || '2026-27'}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Approved vs Requested Intake</span>
          <div className="text-sm font-bold text-slate-900 mt-0.5">{application.requestedIntake} Seats</div>
          <div className="text-xs text-slate-500 mt-0.5">Campus Land: {application.landAreaAcres} Acres</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Submission Date & Ageing</span>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {new Date(application.submissionDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{application.totalAgeingDays} days in review</div>
        </div>
      </div>

      {/* Released Deficiency Notices Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Scrutiny Deficiency Notices ({application.deficiencyNotices?.length || 0})
            </h2>
            <p className="text-xs text-slate-500">
              Formal deficiency notices released by the AICTE Scrutiny Committee requiring clarification
            </p>
          </div>
        </div>

        {(!application.deficiencyNotices || application.deficiencyNotices.length === 0) ? (
          <div className="p-6 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span>No deficiency notices released on this application.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {application.deficiencyNotices.map((notice) => (
              <div
                key={notice.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-gov-navy-950">{notice.noticeNumber}</span>
                    <span className="text-xs font-bold text-slate-900">{notice.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({notice.requirementRef})</span>
                  </div>

                  <div>
                    {notice.status === 'RESOLVED_SATISFIED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Resolved / Satisfied
                      </span>
                    ) : notice.status === 'AWAITING_OFFICER_REVIEW' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Response Awaiting Committee Review
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Clarification Required
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  {notice.description}
                </p>

                {notice.institutionResponse && (
                  <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs">
                    <div className="font-bold text-blue-900 mb-0.5">Your Clarification Response:</div>
                    <p className="text-blue-800">{notice.institutionResponse}</p>
                    {notice.responseDocumentRef && (
                      <div className="text-[11px] text-blue-700 mt-1">
                        Attached Reference: <strong>{notice.responseDocumentRef}</strong>
                      </div>
                    )}
                  </div>
                )}

                {notice.officerReviewNotes && (
                  <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                    <span className="font-bold">Scrutiny Officer Evaluation Note:</span>
                    <p className="mt-0.5">{notice.officerReviewNotes}</p>
                  </div>
                )}

                {notice.status !== 'RESOLVED_SATISFIED' && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenResponseModal(notice)}
                      className="px-3 py-1.5 rounded-lg bg-gov-navy-950 hover:bg-gov-navy-900 text-white text-xs font-bold transition shadow-sm"
                    >
                      {notice.institutionResponse ? 'Update Response / Evidence' : 'Submit Response & Evidence'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploaded Documents Vault */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Uploaded Statutory Documents ({application.documents?.length || 0})
          </h2>
          <p className="text-xs text-slate-500">
            Secure, hashed regulatory documents submitted for AICTE scrutiny
          </p>
        </div>

        {(!application.documents || application.documents.length === 0) ? (
          <p className="text-xs text-slate-500">No documents uploaded for this application.</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {application.documents.map((doc) => (
              <div key={doc.id} className="p-3.5 flex justify-between items-center bg-white hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{doc.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                      {doc.verificationStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    SHA-256: {doc.fileHash ? doc.fileHash.slice(0, 16) + '...' : 'Verified on upload'} • {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <a
                  href={`/api/institution/applications/${application.id}/documents/${doc.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deficiency Response Modal */}
      {activeNoticeForResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Respond to Deficiency Notice
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {activeNoticeForResponse.noticeNumber} — {activeNoticeForResponse.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoticeForResponse(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {responseSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-emerald-900">{responseSuccessMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200">
                  <strong>Deficiency Observation:</strong> {activeNoticeForResponse.description}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institutional Clarification / Explanation *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Provide specific factual explanation addressing the committee observation..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supporting Document Reference / Filename (if applicable)
                  </label>
                  <input
                    type="text"
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="e.g. Registered_Lease_Deed_Addendum_35Yr.pdf"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveNoticeForResponse(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResponse || !responseText.trim()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingResponse ? 'Submitting...' : 'Submit Clarification'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
