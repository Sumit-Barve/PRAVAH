import { prisma } from '../db/prisma';
import {
  ApplicationCategory,
  InstitutionType,
  ApplicationStage,
  UserRole,
  PriorityLevel,
  DocumentType,
  ComplianceStatus,
} from '@prisma/client';
import { CATEGORY_DOCUMENT_CHECKLIST, NugenDocumentValidationResult } from '@saksham/shared';
import { recordAuditEvent } from './auditService';
import { computeFileHash } from './documentStorageService';
import { validateDocumentWithNugen } from './nugenService';

export class InstitutionError extends Error {
  statusCode: number;
  details?: any;
  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'InstitutionError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Retrieves the institution profile for the authenticated tenant.
 */
export const getInstitutionProfile = async (institutionId: string) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  if (!institution) {
    throw new InstitutionError('Institution record not found.', 404);
  }

  return institution;
};

/**
 * Updates editable institution profile details.
 */
export const updateInstitutionProfile = async (
  institutionId: string,
  data: {
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    district?: string;
    pincode?: string;
  }
) => {
  const updated = await prisma.institution.update({
    where: { id: institutionId },
    data,
  });

  return updated;
};

/**
 * Lists all applications belonging strictly to the authenticated institution.
 */
export const getInstitutionApplications = async (institutionId: string) => {
  const applications = await prisma.application.findMany({
    where: { institutionId },
    include: {
      documents: true,
      deficiencyNotices: {
        where: { isReleased: true },
      },
    },
    orderBy: { lastUpdated: 'desc' },
  });

  return applications;
};

/**
 * Retrieves an individual application belonging strictly to the authenticated institution.
 */
export const getInstitutionApplicationById = async (institutionId: string, applicationId: string) => {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      institutionId,
    },
    include: {
      institution: true,
      documents: {
        orderBy: { createdAt: 'desc' },
      },
      deficiencyNotices: {
        where: { isReleased: true }, // Tenant isolation: Draft notices remain hidden
        orderBy: { createdAt: 'desc' },
      },
      complianceItems: {
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  if (!application) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  return application;
};

/**
 * Creates a new application draft for the authenticated institution.
 */
export const createApplicationDraft = async (
  institutionId: string,
  userId: string,
  data: {
    category: ApplicationCategory;
    academicCycle?: string;
    requestedIntake?: number;
    landAreaAcres?: number;
    draftData?: Record<string, unknown>;
  }
) => {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  if (!institution) {
    throw new InstitutionError('Institution not found.', 404);
  }

  const academicCycle = data.academicCycle || '2026-27';
  const tempRef = `DRAFT-${institution.region.slice(0, 2)}-${Date.now().toString().slice(-6)}`;

  const draft = await prisma.application.create({
    data: {
      applicationNumber: tempRef,
      permanentInstituteId: institution.permanentInstituteId,
      instituteName: institution.name,
      trustName: institution.trustName,
      category: data.category,
      institutionType: institution.institutionType,
      region: institution.region,
      state: institution.state,
      currentStage: ApplicationStage.SUBMITTED,
      priority: PriorityLevel.NORMAL,
      totalAgeingDays: 0,
      stageAgeingDays: 0,
      submissionDate: new Date(),
      pendingWithRole: UserRole.SCRUTINY_OFFICER,
      isDeficient: false,
      deficiencyCount: 0,
      landAreaAcres: data.landAreaAcres || 5.0,
      approvedIntake: 0,
      requestedIntake: data.requestedIntake || 180,
      academicCycle,
      isDraft: true,
      draftData: (data.draftData as any) || { step: 1 },
      institutionId: institution.id,
    },
  });

  await recordAuditEvent({
    actorId: userId,
    actorName: institution.name,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'APPLICATION_DRAFT_CREATED',
    actionTitle: 'Application Draft Created',
    entityType: 'APPLICATION',
    entityId: draft.id,
    details: `Draft created for category '${data.category}' (Cycle: ${academicCycle}).`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return draft;
};

/**
 * Updates an in-progress draft application.
 */
export const updateApplicationDraft = async (
  institutionId: string,
  applicationId: string,
  data: {
    category?: ApplicationCategory;
    requestedIntake?: number;
    landAreaAcres?: number;
    draftData?: Record<string, unknown>;
  }
) => {
  const existing = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
  });

  if (!existing) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  if (!existing.isDraft) {
    throw new InstitutionError('Submitted applications cannot be edited as drafts.', 400);
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      ...(data.category && { category: data.category }),
      ...(data.requestedIntake !== undefined && { requestedIntake: data.requestedIntake }),
      ...(data.landAreaAcres !== undefined && { landAreaAcres: data.landAreaAcres }),
      ...(data.draftData && { draftData: data.draftData as any }),
      lastUpdated: new Date(),
    },
  });

  return updated;
};

/**
 * Returns category-specific document checklist combined with currently uploaded documents.
 */
export const getCategoryChecklist = async (institutionId: string, applicationId: string) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
    include: { documents: true },
  });

  if (!application) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  const checklistRules = CATEGORY_DOCUMENT_CHECKLIST[application.category] || [];

  const items = checklistRules.map((rule) => {
    const uploadedDocs = application.documents.filter((d) => d.documentType === rule.documentType);
    const isUploaded = uploadedDocs.length > 0;
    const latestDoc = isUploaded ? uploadedDocs[0] : null;

    let aiValidation: NugenDocumentValidationResult | null = null;
    if (latestDoc?.remarks && latestDoc.remarks.startsWith('{')) {
      try {
        aiValidation = JSON.parse(latestDoc.remarks);
      } catch {
        aiValidation = null;
      }
    }

    return {
      documentType: rule.documentType,
      title: rule.title,
      description: rule.description,
      mandatory: rule.mandatory,
      aphClause: rule.aphClause,
      isUploaded,
      uploadedDocument: latestDoc
        ? {
            id: latestDoc.id,
            fileName: latestDoc.fileName,
            fileSize: latestDoc.fileSize,
            mimeType: latestDoc.mimeType,
            verificationStatus: latestDoc.verificationStatus,
            remarks: latestDoc.remarks,
            aiValidation,
            uploadedAt: latestDoc.createdAt.toISOString(),
          }
        : null,
    };
  });

  return items;
};

/**
 * Uploads an official application document, calculating hash and saving metadata in DB.
 */
export const uploadApplicationDocument = async (
  institutionId: string,
  applicationId: string,
  uploaderId: string,
  file: Express.Multer.File,
  documentType: DocumentType
) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
  });

  if (!application) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  // Calculate file integrity hash
  const fileHash = await computeFileHash(file.path);

  // Run Nugen LLM document validation against the statutory requirement
  const checklistRules = CATEGORY_DOCUMENT_CHECKLIST[application.category] || [];
  const matchingRule = checklistRules.find((r) => r.documentType === documentType);

  let aiValidation: NugenDocumentValidationResult | null = null;
  let verificationStatus = 'UPLOADED_PENDING_REVIEW';
  let remarks: string | null = null;

  try {
    aiValidation = await validateDocumentWithNugen({
      filePath: file.path,
      mimeType: file.mimetype,
      fileName: file.originalname,
      documentType,
      requirementTitle: matchingRule?.title || String(documentType),
      requirementDescription: matchingRule?.description || '',
      aphClause: matchingRule?.aphClause || 'APH 2024-27',
    });

    if (aiValidation) {
      remarks = JSON.stringify(aiValidation);
      if (aiValidation.relevance === 'MATCH') {
        verificationStatus = 'AI_VERIFIED_PENDING_SCRUTINY';
      } else if (aiValidation.relevance === 'LIKELY_MISMATCH') {
        verificationStatus = 'AI_FLAGGED_MISMATCH';
      } else {
        verificationStatus = 'AI_INCONCLUSIVE';
      }
    }
  } catch (aiErr) {
    console.warn('[NUGEN_AI] Validation execution skipped or errored:', aiErr);
  }

  // Upsert or create document record
  const doc = await prisma.applicationDocument.create({
    data: {
      applicationId: application.id,
      institutionId,
      documentType,
      title: file.originalname,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageKey: file.filename,
      fileHash,
      verificationStatus,
      remarks,
      uploadedById: uploaderId,
    },
  });

  await recordAuditEvent({
    actorId: uploaderId,
    actorName: application.instituteName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'DOCUMENT_UPLOADED',
    actionTitle: 'Regulatory Document Uploaded',
    entityType: 'APPLICATION',
    entityId: application.id,
    details: `Uploaded '${file.originalname}' (${(file.size / 1024).toFixed(1)} KB, Type: ${documentType}, AI: ${aiValidation?.relevance || 'MANUAL_PENDING'}).`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return {
    ...doc,
    aiValidation,
  };
};

/**
 * Runs deterministic preliminary checks against configured checklist and mandatory fields.
 */
export const runPreliminaryChecks = async (institutionId: string, applicationId: string) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, institutionId },
    include: { documents: true },
  });

  if (!application) {
    throw new InstitutionError('Application not found or unauthorized access.', 404);
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Mandatory Fields
  if (!application.requestedIntake || application.requestedIntake <= 0) {
    errors.push('Requested Intake must be greater than zero.');
  }

  if (!application.landAreaAcres || application.landAreaAcres < 1.0) {
    errors.push('Campus land area must meet minimum statutory requirement (min 1.0 acre).');
  }

  // Check 2: Mandatory Checklist Documents
  const checklistRules = CATEGORY_DOCUMENT_CHECKLIST[application.category] || [];
  const uploadedDocTypes = new Set(application.documents.map((d) => d.documentType));

  for (const rule of checklistRules) {
    if (rule.mandatory && !uploadedDocTypes.has(rule.documentType)) {
      errors.push(`Missing mandatory document: "${rule.title}" (Required per ${rule.aphClause}).`);
    }
  }

  const passed = errors.length === 0;

  return {
    passed,
    errors,
    warnings,
    category: application.category,
    checkedAt: new Date().toISOString(),
  };
};

/**
 * Submits an application to the SAKSHAM queue via an atomic database transaction.
 */
export const submitApplication = async (
  institutionId: string,
  applicationId: string,
  userId: string,
  userFullName: string
) => {
  // Pre-validate outside transaction
  const checks = await runPreliminaryChecks(institutionId, applicationId);
  if (!checks.passed) {
    throw new InstitutionError(
      'Cannot submit application. Preliminary checks detected missing mandatory requirements.',
      400,
      checks.errors
    );
  }

  // Execute atomic submission transaction
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.application.findFirst({
      where: { id: applicationId, institutionId },
    });

    if (!existing) {
      throw new InstitutionError('Application not found.', 404);
    }

    if (!existing.isDraft) {
      throw new InstitutionError('Application has already been submitted to SAKSHAM.', 400);
    }

    // Generate formal stable SAKSHAM application reference
    const count = await tx.application.count();
    const regionCode = existing.region.replace('_', '');
    const referenceNumber = `AICTE/2026/RO-${regionCode}/${11000 + count}`;

    const submittedApp = await tx.application.update({
      where: { id: applicationId },
      data: {
        applicationNumber: referenceNumber,
        isDraft: false,
        currentStage: ApplicationStage.SUBMITTED,
        pendingWithRole: UserRole.SCRUTINY_OFFICER,
        submissionDate: new Date(),
        lastUpdated: new Date(),
        totalAgeingDays: 0,
        stageAgeingDays: 0,
        priority: PriorityLevel.NORMAL,
      },
      include: {
        documents: true,
      },
    });

    // Create Notification
    await tx.notification.create({
      data: {
        recipientUserId: userId,
        institutionId: existing.institutionId,
        title: 'Application Successfully Submitted',
        message: `Your application has been submitted to SAKSHAM with reference ${referenceNumber}. It is now awaiting Scrutiny Officer evaluation.`,
        type: 'SUCCESS',
        link: `/institution/applications/${submittedApp.id}`,
      },
    });

    return submittedApp;
  });

  // Record audit log
  await recordAuditEvent({
    actorId: userId,
    actorName: userFullName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'APPLICATION_SUBMITTED',
    actionTitle: 'Application Submitted to AICTE Scrutiny Queue',
    entityType: 'APPLICATION',
    entityId: result.id,
    details: `Application '${result.applicationNumber}' successfully submitted by '${userFullName}' for '${result.instituteName}'. Assigned to Scrutiny Officer pool.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return result;
};

/**
 * Retrieves released deficiency notices visible to the authenticated institution.
 */
export const getInstitutionDeficiencies = async (institutionId: string, applicationId?: string) => {
  const whereClause: any = {
    application: { institutionId },
    isReleased: true, // Only released notices are institution-visible
  };

  if (applicationId) {
    whereClause.applicationId = applicationId;
  }

  const notices = await prisma.deficiencyNotice.findMany({
    where: whereClause,
    include: {
      application: {
        select: {
          id: true,
          applicationNumber: true,
          instituteName: true,
          currentStage: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return notices;
};

/**
 * Submits an institution clarification / response to an active deficiency notice.
 */
export const respondToDeficiencyNotice = async (
  institutionId: string,
  noticeId: string,
  userId: string,
  userFullName: string,
  response: {
    responseText: string;
    documentRef?: string;
  }
) => {
  const notice = await prisma.deficiencyNotice.findFirst({
    where: {
      id: noticeId,
      application: { institutionId },
      isReleased: true,
    },
    include: { application: true },
  });

  if (!notice) {
    throw new InstitutionError('Deficiency notice not found or unauthorized access.', 404);
  }

  const updatedNotice = await prisma.deficiencyNotice.update({
    where: { id: noticeId },
    data: {
      institutionResponse: response.responseText.trim(),
      responseDocumentRef: response.documentRef?.trim() || null,
      responseSubmittedAt: new Date(),
      status: 'AWAITING_OFFICER_REVIEW',
    },
  });

  // Record audit log
  await recordAuditEvent({
    actorId: userId,
    actorName: userFullName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'DEFICIENCY_RESPONSE_SUBMITTED',
    actionTitle: 'Institution Deficiency Clarification Submitted',
    entityType: 'DEFICIENCY_NOTICE',
    entityId: notice.id,
    details: `Clarification response submitted for Notice '${notice.noticeNumber}' on Application '${notice.application.applicationNumber}'.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return updatedNotice;
};

/**
 * Retrieves compliance undertakings associated with the authenticated institution.
 */
export const getInstitutionCompliance = async (institutionId: string) => {
  const complianceItems = await prisma.complianceItem.findMany({
    where: {
      application: { institutionId },
    },
    include: {
      application: {
        select: {
          id: true,
          applicationNumber: true,
          instituteName: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  return complianceItems;
};

/**
 * Submits evidence against a compliance undertaking.
 */
export const submitComplianceEvidence = async (
  institutionId: string,
  complianceId: string,
  userId: string,
  userFullName: string,
  documentRef: string
) => {
  const item = await prisma.complianceItem.findFirst({
    where: {
      id: complianceId,
      application: { institutionId },
    },
    include: { application: true },
  });

  if (!item) {
    throw new InstitutionError('Compliance obligation not found or unauthorized access.', 404);
  }

  const updated = await prisma.complianceItem.update({
    where: { id: complianceId },
    data: {
      status: ComplianceStatus.UNDER_REVIEW,
      submittedDocumentRef: documentRef.trim(),
    },
  });

  await recordAuditEvent({
    actorId: userId,
    actorName: userFullName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'COMPLIANCE_EVIDENCE_SUBMITTED',
    actionTitle: 'Compliance Evidence Submitted',
    entityType: 'COMPLIANCE',
    entityId: item.id,
    details: `Evidence reference '${documentRef}' submitted for '${item.undertakingType}'.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return updated;
};

/**
 * Retrieves in-app notifications for the institution.
 */
export const getInstitutionNotifications = async (institutionId: string) => {
  const notifications = await prisma.notification.findMany({
    where: { institutionId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return notifications;
};

/**
 * Marks a notification as read.
 */
export const markNotificationAsRead = async (institutionId: string, notificationId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, institutionId },
  });

  if (!notification) {
    throw new InstitutionError('Notification not found.', 404);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};
