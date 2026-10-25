import React, { useState } from 'react';
import { Application } from '@saksham/shared';
import { CouncilEmblem, IndiaFlag } from '../common/GovtEmblem';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Printer,
  ShieldCheck,
  Building,
  UserCheck,
  Send,
  FileWarning,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  parameterName: string;
  aphClause: string;
  mandatory: boolean;
  status: 'COMPLIANT' | 'DEFICIENT';
  remark: string;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: 'chk-1',
    category: 'Land & Title',
    parameterName: 'Registered Sale Deed / Government Lease (Tenure >= 30 Years)',
    aphClause: 'APH 2024–27 Chapter I, Section 1.3(a)',
    mandatory: true,
    status: 'COMPLIANT',
    remark: 'Verified Sub-Registrar registered deed. Clear unencumbered title on single plot.',
  },
  {
    id: 'chk-2',
    category: 'Infrastructure',
    parameterName: 'Approved Building Plan with Barrier-Free Ramps & Lift Access',
    aphClause: 'APH 2024–27 Chapter I, Section 1.3(c) & NBC 2016',
    mandatory: true,
    status: 'COMPLIANT',
    remark: 'Municipal approved blueprint inspected. Dedicated ramps at entry and lift operational.',
  },
  {
    id: 'chk-3',
    category: 'Safety & Municipal',
    parameterName: 'Valid Permanent Fire Safety Certificate (Fire NOC)',
    aphClause: 'APH 2024–27 Chapter I, Section 1.3(f)',
    mandatory: true,
    status: 'COMPLIANT',
    remark: 'Valid Chief Fire Officer certificate verified. Expiry beyond current academic year.',
  },
  {
    id: 'chk-4',
    category: 'Academic Faculty',
    parameterName: 'Student-Teacher Ratio (1:15/1:20) & Cadre Ratio (1:2:6)',
    aphClause: 'APH 2024–27 Chapter II, Section 2.4',
    mandatory: true,
    status: 'DEFICIENT',
    remark: 'Shortfall of 3 regular Professors and 4 Associate Professors in Computer Science cadre.',
  },
  {
    id: 'chk-5',
    category: 'Financial Reserves',
    parameterName: 'Joint Lien FDR / Endowment Deposit in Nationalized Bank',
    aphClause: 'APH 2024–27 Chapter I, Section 1.4',
    mandatory: true,
    status: 'COMPLIANT',
    remark: 'Fixed Deposit Receipt in joint lien with AICTE Member Secretary verified in SBI.',
  },
];

interface ScrutinyEvaluationModalProps {
  application: Application | null;
  onClose: () => void;
}

export const ScrutinyEvaluationModal: React.FC<ScrutinyEvaluationModalProps> = ({
  application,
  onClose,
}) => {
  if (!application) return null;

  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [officerNotes, setOfficerNotes] = useState(
    'Scrutiny evaluation completed per AICTE APH 2024–27 guidelines. Deficiency noted in faculty cadre.'
  );

  const toggleStatus = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'COMPLIANT' ? 'DEFICIENT' : 'COMPLIANT' }
          : item
      )
    );
  };

  const updateRemark = (id: string, remark: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remark } : item))
    );
  };

  const compliantCount = checklist.filter((i) => i.status === 'COMPLIANT').length;
  const deficientCount = checklist.filter((i) => i.status === 'DEFICIENT').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#0A1B38] text-white p-5 rounded-t-xl flex items-start justify-between border-b border-gov-navy-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Official Scrutiny Checklist Evaluation
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-xs text-slate-300">{application.applicationNumber}</span>
            </div>
            <h2 className="text-lg font-extrabold text-white">{application.instituteName}</h2>
            <p className="text-xs text-slate-300">
              PID: <span className="font-mono font-semibold">{application.permanentInstituteId}</span> • Region: {application.region} • Category: {application.category.replace(/_/g, ' ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-gov-navy-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-slate-500 font-semibold block text-[11px]">Total Parameters</span>
              <span className="text-xl font-bold text-slate-900">{checklist.length} Norms</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <span className="text-emerald-700 font-semibold block text-[11px]">Compliant Norms</span>
              <span className="text-xl font-bold text-emerald-800">{compliantCount} Cleared</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
              <span className="text-rose-700 font-semibold block text-[11px]">Deficiencies Flagged</span>
              <span className="text-xl font-bold text-rose-800">{deficientCount} Shortfalls</span>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
              Statutory Evaluation Checklist (APH 2024–27 Chapter I & II)
            </h4>

            {checklist.map((item, index) => {
              const isCompliant = item.status === 'COMPLIANT';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isCompliant ? 'bg-slate-50/70 border-slate-200' : 'bg-rose-50/60 border-rose-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          Norm {index + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">[{item.category}]</span>
                        <span className="font-mono text-[10px] text-gov-navy-800">{item.aphClause}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs mt-0.5">{item.parameterName}</p>
                    </div>

                    {/* Toggle Button */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
                          isCompliant
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-rose-600 text-white shadow-sm'
                        }`}
                      >
                        {isCompliant ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" /> Deficient
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Observation Input */}
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) => updateRemark(item.id, e.target.value)}
                    placeholder="Enter scrutiny observation or deficiency notes..."
                    className="w-full text-[11px] border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gov-navy-700"
                  />
                </div>
              );
            })}
          </div>

          {/* Committee Recommendation Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block text-xs">
              Scrutiny Committee Final Recommendation Remarks
            </label>
            <textarea
              rows={2}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-gov-navy-700"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl space-y-3">
          {actionFeedback && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-center justify-between">
              <span>{actionFeedback}</span>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-[11px] font-bold text-blue-700 hover:underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowLetterPreview(true)}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-gov-navy-800" />
              <span>Generate Official Deficiency Letter (PDF)</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-bold"
              >
                Cancel
              </button>
              {deficientCount === 0 ? (
                <button
                  onClick={() => {
                    setActionFeedback(
                      `[Read-Only Stage]: Scrutiny passed for ${application.applicationNumber}. Stage transition to EVC is preserved for Phase 3 mutation engine.`
                    );
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Recommend for EVC Committee</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActionFeedback(
                      `[Read-Only Stage]: Deficiency notice formulated (${deficientCount} deficiencies). Formal dispatch and Re-Scrutiny transition will be committed in Phase 3.`
                    );
                  }}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Formal Rectification Notice ({deficientCount} Deficiencies)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Official AICTE Letterhead Preview Sub-Modal */}
        {showLetterPreview && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 border border-slate-300 space-y-5 animate-in zoom-in-95 duration-150 relative">
              {/* Official AICTE Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4 relative">
                <div className="flex justify-center mb-1">
                  <CouncilEmblem size={48} />
                </div>
                <p className="text-[10px] font-bold text-[#8B1A10]">अखिल भारतीय तकनीकी शिक्षा परिषद</p>
                <h3 className="text-sm font-extrabold text-gov-navy-950">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </h3>
                <p className="text-[10px] text-slate-500">
                  (A Statutory Body of the Government of India) • Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
                </p>
              </div>

              {/* Letter Reference & Date */}
              <div className="flex justify-between text-[11px] font-mono text-slate-700">
                <span>Ref: AICTE/DEF/{application.applicationNumber.replace(/\//g, '-')}/2026</span>
                <span>Date: 23 October 2026</span>
              </div>

              {/* Addressee */}
              <div className="text-xs space-y-0.5 text-slate-800">
                <p className="font-bold">To,</p>
                <p className="font-semibold">{application.trustName}</p>
                <p>{application.instituteName}</p>
                <p>Permanent Institute ID: {application.permanentInstituteId}</p>
              </div>

              {/* Subject */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                <span className="font-bold text-gov-navy-950">Subject: </span>
                <span className="font-semibold text-slate-800">
                  Deficiency Scrutiny Report for AICTE Approval Process 2026–2027 — Notice for Rectification.
                </span>
              </div>

              {/* Deficiencies Table */}
              <div className="space-y-2 text-xs">
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  Sir / Madam, with reference to your online application for the academic year 2026–2027, the Regional Scrutiny Committee has recorded the following compliance deficiencies under the Approval Process Handbook (APH 2024–27):
                </p>

                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-left font-bold">Norm / Parameter</th>
                      <th className="border border-slate-300 p-1.5 text-left font-bold">Status</th>
                      <th className="border border-slate-300 p-1.5 text-left font-bold">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist
                      .filter((i) => i.status === 'DEFICIENT')
                      .map((def) => (
                        <tr key={def.id}>
                          <td className="border border-slate-300 p-1.5 font-medium">{def.parameterName}</td>
                          <td className="border border-slate-300 p-1.5 text-rose-700 font-bold">DEFICIENT</td>
                          <td className="border border-slate-300 p-1.5 text-slate-600">{def.remark}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Directive */}
              <p className="text-[11px] text-slate-700 leading-relaxed border-t border-slate-200 pt-3">
                You are hereby granted <strong>10 statutory calendar days</strong> to upload authenticated rectifications through the PRAVAH institution compliance portal for Re-Scrutiny Committee appraisal.
              </p>

              {/* Digital Signature */}
              <div className="flex justify-between items-end pt-4 text-xs">
                <div className="text-[10px] text-slate-400">
                  <span>Cryptographically Signed via PRAVAH e-Gov Gateway</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gov-navy-950">Regional Officer (RO)</div>
                  <div className="text-[11px] text-slate-500">All India Council for Technical Education</div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  onClick={() => setShowLetterPreview(false)}
                  className="px-4 py-1.5 bg-gov-navy-900 text-white rounded text-xs font-bold"
                >
                  Close Letter Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
