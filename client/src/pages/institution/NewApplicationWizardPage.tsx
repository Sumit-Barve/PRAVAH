import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  createApplicationDraft,
  updateApplicationDraft,
  getInstitutionApplication,
  getCategoryChecklist,
  uploadApplicationDocument,
  runPreliminaryChecks,
  submitApplication,
  ChecklistItemStatus,
  PreliminaryCheckResult,
} from '../../services/institutionService';
import { ApplicationCategory, DocumentType } from '@saksham/shared';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Building2,
  Layers,
  ShieldCheck,
  Send,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Category & Cycle', desc: 'Select regulatory category' },
  { id: 2, title: 'Institution Info', desc: 'Review campus registration' },
  { id: 3, title: 'Programmes & Intake', desc: 'Capacity and land metrics' },
  { id: 4, title: 'Document Checklist', desc: 'Upload statutory documents' },
  { id: 5, title: 'Preliminary Validation', desc: 'Rule compliance checks' },
  { id: 6, title: 'Submit to PRAVAH', desc: 'Confirm and dispatch' },
];

export const NewApplicationWizardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draftId');

  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(draftIdParam);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<ApplicationCategory>('NEW_INSTITUTE');
  const [academicCycle, setAcademicCycle] = useState('2026-27');
  const [requestedIntake, setRequestedIntake] = useState(240);
  const [landAreaAcres, setLandAreaAcres] = useState(7.5);
  const [programName, setProgramName] = useState('Engineering & Technology');
  const [courses, setCourses] = useState([
    { name: 'Computer Science & Engineering', intake: 120, level: 'Under Graduate' },
    { name: 'Electronics & Communication Engineering', intake: 60, level: 'Under Graduate' },
    { name: 'Mechanical Engineering', intake: 60, level: 'Under Graduate' },
  ]);

  // Checklist & Validation State
  const [checklist, setChecklist] = useState<ChecklistItemStatus[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [preliminaryResults, setPreliminaryResults] = useState<PreliminaryCheckResult | null>(null);

  // Load existing draft if draftId provided
  useEffect(() => {
    if (draftIdParam) {
      const loadDraft = async () => {
        try {
          const app = await getInstitutionApplication(draftIdParam);
          setApplicationId(app.id);
          setCategory(app.category);
          setAcademicCycle(app.academicCycle || '2026-27');
          setRequestedIntake(app.requestedIntake || 240);
          setLandAreaAcres(app.landAreaAcres || 5.0);
          if (app.draftData) {
            const data: any = app.draftData;
            if (data.programName) setProgramName(data.programName);
            if (data.courses) setCourses(data.courses);
            if (data.step) setCurrentStep(data.step);
          }
        } catch (err) {
          console.error('Failed to load draft:', err);
        }
      };
      loadDraft();
    }
  }, [draftIdParam]);

  // Load category checklist when reaching Step 4
  const refreshChecklist = async (appId: string) => {
    try {
      const items = await getCategoryChecklist(appId);
      setChecklist(items);
    } catch (err) {
      console.error('Failed to load checklist:', err);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const draftPayload = {
        category,
        academicCycle,
        requestedIntake: Number(requestedIntake),
        landAreaAcres: Number(landAreaAcres),
        draftData: {
          programName,
          courses,
          step: currentStep,
        },
      };

      if (!applicationId) {
        const created = await createApplicationDraft(draftPayload);
        setApplicationId(created.id);
        setSuccessMessage('Application draft created successfully.');
      } else {
        await updateApplicationDraft(applicationId, draftPayload);
        setSuccessMessage('Draft updated and saved.');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    setErrorMessage(null);

    // Save draft at every step transition
    setIsSaving(true);
    try {
      const draftPayload = {
        category,
        academicCycle,
        requestedIntake: Number(requestedIntake),
        landAreaAcres: Number(landAreaAcres),
        draftData: {
          programName,
          courses,
          step: currentStep + 1,
        },
      };

      let activeId = applicationId;
      if (!activeId) {
        const created = await createApplicationDraft(draftPayload);
        activeId = created.id;
        setApplicationId(created.id);
      } else {
        await updateApplicationDraft(activeId, draftPayload);
      }

      if (currentStep === 3) {
        // Prepare checklist for Step 4
        await refreshChecklist(activeId);
      } else if (currentStep === 4) {
        // Run preliminary checks for Step 5
        const res = await runPreliminaryChecks(activeId);
        setPreliminaryResults(res);
      }

      setCurrentStep((prev) => Math.min(prev + 1, 6));
    } catch (err: any) {
      setErrorMessage(err.message || 'Error navigating to next step.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    if (!applicationId || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingDocType(docType);
    setErrorMessage(null);

    try {
      await uploadApplicationDocument(applicationId, file, docType);
      await refreshChecklist(applicationId);
      setSuccessMessage(`Document "${file.name}" uploaded successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed. Ensure PDF/PNG format and max 10MB.');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleFinalSubmit = async () => {
    if (!applicationId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitApplication(applicationId);
      navigate(`/institution/applications/${res.application.id}?submitted=true`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please verify preliminary checks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span>Institution Portal</span>
            <span>/</span>
            <span>Applications</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">New Application Wizard</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            AICTE Approval Application Creation
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>
        </div>
      </div>

      {/* Wizard Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[640px]">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;

            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-gov-navy-950 text-white ring-4 ring-blue-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-gov-navy-950' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="text-[10px] text-slate-400">{s.desc}</div>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition ${
                      currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Step Panels */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col justify-between">
        {/* Step 1: Category & Academic Cycle */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Step 1: Select Application Category & Academic Cycle
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configured statutory categories determined by AICTE Approval Process Handbook (APH 2024–27).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Application Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ApplicationCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                >
                  <option value="NEW_INSTITUTE">Establishment of New Technical Institution</option>
                  <option value="EOA_EXISTING">Extension of Approval (EoA Existing)</option>
                  <option value="INTAKE_INCREASE">Increase in Intake / Additional Course(s)</option>
                  <option value="SUPERNUMERARY_SEATS">Introduction of Supernumerary Seats (FN / OCI / NRI)</option>
                  <option value="CHANGE_OF_SITE">Change of Site / Location of Campus</option>
                  <option value="WOMEN_TO_COED">Conversion from Women's Institution to Co-Education</option>
                  <option value="CLOSURE">Progressive or Complete Closure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Approval Cycle *
                </label>
                <select
                  value={academicCycle}
                  onChange={(e) => setAcademicCycle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                >
                  <option value="2026-27">Academic Cycle 2026–27 (Current Active)</option>
                  <option value="2027-28">Academic Cycle 2027–28</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Statutory Note on Category Selection</span>
              </div>
              <p>
                Each category invokes category-specific document checklists and preliminary automated scrutiny rules. For example, <strong>Establishment of New Technical Institution</strong> mandates registered 30-year land lease, occupancy certificate, fire safety clearance, and joint FDR endowment.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Review Institution Info */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Step 2: Review Institutional Identification & Jurisdiction
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative record retrieved from PRAVAH Institutional Directory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Institution Name</span>
                <p className="text-sm font-bold text-slate-900">{currentUser?.institutionName}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Permanent Institute ID (PID)</span>
                <p className="text-sm font-bold font-mono text-gov-navy-950">
                  {currentUser?.permanentInstituteId || 'Will be allocated upon first approval'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Regional Bureau Jurisdiction</span>
                <p className="text-sm font-bold text-slate-900">
                  {currentUser?.region ? currentUser.region.replace('_', ' ') : 'National Pool (Assigned)'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Authoritative Representative</span>
                <p className="text-sm font-bold text-slate-900">
                  {currentUser?.fullName} ({currentUser?.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Need to update permanent institution contact details? You can do so in the{' '}
              <span className="font-bold text-blue-600">Institution Profile</span> tab.
            </p>
          </div>
        )}

        {/* Step 3: Programmes & Intake */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Step 3: Academic Capacity & Campus Infrastructure
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory intake capacity and campus land area required for physical verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Requested Annual Intake (Seats) *
                </label>
                <input
                  type="number"
                  min="30"
                  step="30"
                  value={requestedIntake}
                  onChange={(e) => setRequestedIntake(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">Standard AICTE division batch: 60 seats.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Land Area in Acres *
                </label>
                <input
                  type="number"
                  min="1.0"
                  step="0.5"
                  value={landAreaAcres}
                  onChange={(e) => setLandAreaAcres(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">Minimum requirement: Urban 2.5 acres / Rural 7.5 acres.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Proposed Technical Programme & Courses
              </label>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Course / Specialization</th>
                      <th className="py-2.5 px-3">Level</th>
                      <th className="py-2.5 px-3">Requested Intake</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((c, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-slate-900">{c.name}</td>
                        <td className="py-2 px-3 text-slate-600">{c.level}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{c.intake} seats</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Category Document Checklist */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Step 4: Category-Specific Statutory Document Checklist
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload verified PDF/JPEG/PNG documents corresponding to AICTE APH 2024–27 clauses.
              </p>
            </div>

            <div className="space-y-3">
              {checklist.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Loading category document requirements...
                </div>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.documentType}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                        {item.mandatory && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">
                            Mandatory
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">{item.aphClause}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>

                      {item.isUploaded && item.uploadedDocument && (
                        <div className="mt-2 space-y-1.5">
                          <div className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Uploaded: <strong>{item.uploadedDocument.fileName}</strong> ({(item.uploadedDocument.fileSize / 1024).toFixed(1)} KB)</span>
                          </div>

                          {item.uploadedDocument.aiValidation && (
                            <div className="p-2.5 rounded-lg border text-xs space-y-1.5 bg-white border-slate-200">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-[11px]">
                                  <ShieldCheck className="w-3.5 h-3.5 text-gov-navy-600" />
                                  Nugen AI Assessment:
                                </span>
                                {item.uploadedDocument.aiValidation.relevance === 'MATCH' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    MATCH: Compliant Instrument
                                  </span>
                                )}
                                {item.uploadedDocument.aiValidation.relevance === 'LIKELY_MISMATCH' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    LIKELY MISMATCH: {item.uploadedDocument.aiValidation.predictedDocumentType}
                                  </span>
                                )}
                                {item.uploadedDocument.aiValidation.relevance === 'INCONCLUSIVE' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                    INCONCLUSIVE (Manual Review Required)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {item.uploadedDocument.aiValidation.explanation}
                              </p>
                              {item.uploadedDocument.aiValidation.extractedFields && Object.keys(item.uploadedDocument.aiValidation.extractedFields).length > 0 && (
                                <div className="pt-0.5 flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono">
                                  {item.uploadedDocument.aiValidation.extractedFields.documentNumber && (
                                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                      Ref: {item.uploadedDocument.aiValidation.extractedFields.documentNumber}
                                    </span>
                                  )}
                                  {item.uploadedDocument.aiValidation.extractedFields.issuingAuthority && (
                                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                      Authority: {item.uploadedDocument.aiValidation.extractedFields.issuingAuthority}
                                    </span>
                                  )}
                                  {item.uploadedDocument.aiValidation.extractedFields.expiryDate && (
                                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                      Valid Till: {item.uploadedDocument.aiValidation.extractedFields.expiryDate}
                                    </span>
                                  )}
                                  {item.uploadedDocument.aiValidation.extractedFields.landAreaAcres && (
                                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                      Area: {item.uploadedDocument.aiValidation.extractedFields.landAreaAcres}
                                    </span>
                                  )}
                                </div>
                              )}
                              {item.uploadedDocument.aiValidation.inconsistencies && item.uploadedDocument.aiValidation.inconsistencies.length > 0 && (
                                <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                                  <strong>Observation:</strong> {item.uploadedDocument.aiValidation.inconsistencies.join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <label className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer shadow-sm transition">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>{uploadingDocType === item.documentType ? 'Uploading...' : item.isUploaded ? 'Re-upload Document' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          disabled={uploadingDocType === item.documentType}
                          onChange={(e) => handleFileUpload(e, item.documentType)}
                        />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 5: Preliminary Validation Results */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Step 5: Preliminary Scrutiny Validation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic automated checks evaluate mandatory documents, land metrics, and statutory completeness.
              </p>
            </div>

            {preliminaryResults ? (
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-xl border ${
                    preliminaryResults.passed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {preliminaryResults.passed ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="text-sm font-bold">
                        {preliminaryResults.passed
                          ? 'Preliminary Checks Passed Successfully!'
                          : 'Mandatory Compliance Checks Incomplete'}
                      </h3>
                      <p className="text-xs opacity-90 mt-0.5">
                        {preliminaryResults.passed
                          ? 'All required category documents and statutory fields are validated. You may proceed to submit.'
                          : 'Please rectify the following deficiencies before submitting to PRAVAH.'}
                      </p>
                    </div>
                  </div>
                </div>

                {!preliminaryResults.passed && (
                  <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-2">
                    <span className="text-xs font-bold text-rose-900">Required Rectifications:</span>
                    <ul className="list-disc list-inside text-xs text-rose-800 space-y-1">
                      {preliminaryResults.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800 mb-1">Human Authority Safeguard:</div>
                  <p>
                    PRAVAH's preliminary checks assist applicant institutions and scrutiny officers. Automated clearance does not grant autonomous approval; statutory evaluation remains under authorized committee authority.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                Running automated validation checks...
              </div>
            )}
          </div>
        )}

        {/* Step 6: Confirm & Submit */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Step 6: Preview Application & Submit to PRAVAH Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review the submission summary. Submission assigns your application to the active scrutiny queue.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-500">Institution:</span>
                  <div className="font-bold text-slate-900">{currentUser?.institutionName}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Regulatory Category:</span>
                  <div className="font-bold text-slate-900">{category.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Academic Cycle:</span>
                  <div className="font-bold text-slate-900">{academicCycle}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Requested Intake:</span>
                  <div className="font-bold text-slate-900">{requestedIntake} seats</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-500">Uploaded Document Files:</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {checklist
                    .filter((c) => c.isUploaded)
                    .map((c) => (
                      <span key={c.documentType} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                        {c.title}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <div className="font-bold mb-1">Formal Submission Declaration:</div>
              <p>
                By clicking "Submit Application to PRAVAH", an official reference will be minted, and the application will be assigned to the AICTE Scrutiny Officer pool. You can track progress and deficiency notices directly from your dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Bottom Navigation Buttons */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={() => setCurrentStep((p) => Math.max(p - 1, 1))}
            disabled={currentStep === 1 || isSaving || isSubmitting}
            className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-30 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving}
              className="inline-flex items-center space-x-1.5 py-2 px-5 rounded-lg bg-gov-navy-950 text-white text-xs font-bold hover:bg-gov-navy-900 shadow-sm transition disabled:opacity-50"
            >
              <span>{isSaving ? 'Processing...' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={Boolean(isSubmitting || (preliminaryResults && !preliminaryResults.passed))}
              className="inline-flex items-center space-x-2 py-2.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting to Queue...' : 'Submit Application to PRAVAH'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
