import React, { useState, useEffect } from 'react';
import { getInstitutionCompliance, submitComplianceEvidence } from '../../services/institutionService';
import { ComplianceItem } from '@saksham/shared';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';

export const InstitutionCompliancePage: React.FC = () => {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<ComplianceItem | null>(null);
  const [documentRef, setDocumentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCompliance = async () => {
    setIsLoading(true);
    try {
      const data = await getInstitutionCompliance();
      setItems(data);
    } catch (err) {
      console.error('Failed to load compliance items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  const handleOpenModal = (item: ComplianceItem) => {
    setActiveItem(item);
    setDocumentRef(item.submittedDocumentRef || '');
    setSuccessMsg(null);
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !documentRef.trim()) return;

    setIsSubmitting(true);
    try {
      await submitComplianceEvidence(activeItem.id, documentRef.trim());
      setSuccessMsg('Compliance evidence submitted successfully. Awaiting scrutiny verification.');
      await fetchCompliance();
      setTimeout(() => {
        setActiveItem(null);
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit evidence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Compliance & Undertakings</h1>
        <p className="text-xs text-slate-500">
          Statutory undertakings and condition verifications registered against institutional approvals
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading compliance records...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No active undertakings</h3>
            <p className="text-xs text-slate-500 mt-1">Your institution has zero outstanding regulatory conditions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Undertaking Type</th>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Evidence Submitted</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{item.undertakingType}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5 max-w-sm line-clamp-1">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gov-navy-950">
                      {item.applicationNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </div>
                      {item.isOverdue && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 mt-0.5 inline-block">
                          Overdue ({item.daysRemaining} days)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'VERIFIED_SATISFACTORY' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Verified Satisfactory
                        </span>
                      ) : item.status === 'UNDER_REVIEW' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Evidence Under Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Pending Submission
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {item.submittedDocumentRef || 'None'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="px-3 py-1.5 rounded-lg bg-gov-navy-950 text-white font-bold text-xs hover:bg-gov-navy-900 transition"
                      >
                        {item.submittedDocumentRef ? 'Update Evidence' : 'Submit Evidence'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Evidence Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Submit Compliance Evidence
              </h3>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-emerald-900">{successMsg}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitEvidence} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
                  <div className="font-bold text-slate-900">{activeItem.undertakingType}</div>
                  <p className="text-slate-600 mt-0.5">{activeItem.description}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Filename / Verified Storage Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="e.g. Fire_Safety_NOC_Renewal_2026.pdf"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the name or reference of the registered certificate addressing this undertaking.
                  </p>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !documentRef.trim()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Commit Evidence'}</span>
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
