import { apiGet, apiPost, apiPut, apiPatch, apiUpload } from './apiClient';
import {
  Application,
  Institution,
  ApplicationDocument,
  DeficiencyNotice,
  ComplianceItem,
  Notification,
  ApplicationCategory,
  DocumentType,
  NugenDocumentValidationResult,
} from '@saksham/shared';

export interface ChecklistItemStatus {
  documentType: DocumentType;
  title: string;
  description: string;
  mandatory: boolean;
  aphClause: string;
  isUploaded: boolean;
  uploadedDocument?: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    verificationStatus: string;
    remarks?: string | null;
    aiValidation?: NugenDocumentValidationResult | null;
    uploadedAt: string;
  } | null;
}

export interface PreliminaryCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  category: ApplicationCategory;
  checkedAt: string;
}

export const getInstitutionProfile = async (): Promise<Institution> => {
  const res = await apiGet<{ success: boolean; data: Institution }>('/institution/profile');
  return res.data;
};

export const updateInstitutionProfile = async (data: Partial<Institution>): Promise<Institution> => {
  const res = await apiPut<{ success: boolean; data: Institution }>('/institution/profile', data);
  return res.data;
};

export const getInstitutionApplications = async (): Promise<Application[]> => {
  const res = await apiGet<{ success: boolean; data: Application[] }>('/institution/applications');
  return res.data;
};

export const getInstitutionApplication = async (id: string): Promise<Application & {
  institution: Institution;
  documents: ApplicationDocument[];
  deficiencyNotices: DeficiencyNotice[];
  complianceItems: ComplianceItem[];
}> => {
  const res = await apiGet<{ success: boolean; data: any }>(`/institution/applications/${id}`);
  return res.data;
};

export const createApplicationDraft = async (data: {
  category: ApplicationCategory;
  academicCycle?: string;
  requestedIntake?: number;
  landAreaAcres?: number;
  draftData?: Record<string, unknown>;
}): Promise<Application> => {
  const res = await apiPost<{ success: boolean; data: Application }>('/institution/applications/draft', data);
  return res.data;
};

export const updateApplicationDraft = async (
  id: string,
  data: {
    category?: ApplicationCategory;
    requestedIntake?: number;
    landAreaAcres?: number;
    draftData?: Record<string, unknown>;
  }
): Promise<Application> => {
  const res = await apiPut<{ success: boolean; data: Application }>(`/institution/applications/${id}/draft`, data);
  return res.data;
};

export const getCategoryChecklist = async (applicationId: string): Promise<ChecklistItemStatus[]> => {
  const res = await apiGet<{ success: boolean; data: ChecklistItemStatus[] }>(
    `/institution/applications/${applicationId}/checklist`
  );
  return res.data;
};

export const uploadApplicationDocument = async (
  applicationId: string,
  file: File,
  documentType: DocumentType
): Promise<ApplicationDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const res = await apiUpload<{ success: boolean; data: ApplicationDocument }>(
    `/institution/applications/${applicationId}/documents`,
    formData
  );
  return res.data;
};

export const runPreliminaryChecks = async (applicationId: string): Promise<PreliminaryCheckResult> => {
  const res = await apiPost<{ success: boolean; data: PreliminaryCheckResult }>(
    `/institution/applications/${applicationId}/preliminary-checks`
  );
  return res.data;
};

export const submitApplication = async (applicationId: string): Promise<{
  application: Application;
  message: string;
}> => {
  const res = await apiPost<{ success: boolean; data: { application: Application; message: string } }>(
    `/institution/applications/${applicationId}/submit`
  );
  return res.data;
};

export const getInstitutionDeficiencies = async (applicationId?: string): Promise<DeficiencyNotice[]> => {
  const res = await apiGet<{ success: boolean; data: DeficiencyNotice[] }>(
    '/institution/deficiencies',
    applicationId ? { applicationId } : undefined
  );
  return res.data;
};

export const respondToDeficiency = async (
  noticeId: string,
  responseText: string,
  documentRef?: string
): Promise<DeficiencyNotice> => {
  const res = await apiPost<{ success: boolean; data: DeficiencyNotice }>(
    `/institution/deficiencies/${noticeId}/respond`,
    { responseText, documentRef }
  );
  return res.data;
};

export const getInstitutionCompliance = async (): Promise<ComplianceItem[]> => {
  const res = await apiGet<{ success: boolean; data: ComplianceItem[] }>('/institution/compliance');
  return res.data;
};

export const submitComplianceEvidence = async (
  complianceId: string,
  documentRef: string
): Promise<ComplianceItem> => {
  const res = await apiPost<{ success: boolean; data: ComplianceItem }>(
    `/institution/compliance/${complianceId}/evidence`,
    { documentRef }
  );
  return res.data;
};

export const getInstitutionNotifications = async (): Promise<Notification[]> => {
  const res = await apiGet<{ success: boolean; data: Notification[] }>('/institution/notifications');
  return res.data;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await apiPatch(`/institution/notifications/${notificationId}/read`);
};
