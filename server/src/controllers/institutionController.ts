import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getInstitutionProfile,
  updateInstitutionProfile,
  getInstitutionApplications,
  getInstitutionApplicationById,
  createApplicationDraft,
  updateApplicationDraft,
  getCategoryChecklist,
  uploadApplicationDocument,
  runPreliminaryChecks,
  submitApplication,
  getInstitutionDeficiencies,
  respondToDeficiencyNotice,
  getInstitutionCompliance,
  submitComplianceEvidence,
  getInstitutionNotifications,
  markNotificationAsRead,
  InstitutionError,
} from '../services/institutionService';
import { getStorageFilePath } from '../services/documentStorageService';
import { prisma } from '../db/prisma';
import { ApplicationCategory, DocumentType } from '@prisma/client';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const profile = await getInstitutionProfile(institutionId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const updated = await updateInstitutionProfile(institutionId, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const applications = await getInstitutionApplications(institutionId);
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const application = await getInstitutionApplicationById(institutionId, req.params.id);
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};

export const createDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const userId = req.user!.id;
    const { category, academicCycle, requestedIntake, landAreaAcres, draftData } = req.body;

    if (!category) {
      res.status(400).json({ success: false, error: { message: 'Category is required', statusCode: 400 } });
      return;
    }

    const draft = await createApplicationDraft(institutionId, userId, {
      category: category as ApplicationCategory,
      academicCycle,
      requestedIntake: requestedIntake ? Number(requestedIntake) : undefined,
      landAreaAcres: landAreaAcres ? Number(landAreaAcres) : undefined,
      draftData,
    });

    res.status(201).json({ success: true, data: draft });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};

export const updateDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const applicationId = req.params.id;
    const { category, requestedIntake, landAreaAcres, draftData } = req.body;

    const updated = await updateApplicationDraft(institutionId, applicationId, {
      category: category as ApplicationCategory | undefined,
      requestedIntake: requestedIntake !== undefined ? Number(requestedIntake) : undefined,
      landAreaAcres: landAreaAcres !== undefined ? Number(landAreaAcres) : undefined,
      draftData,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};

export const getChecklist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const checklist = await getCategoryChecklist(institutionId, req.params.id);
    res.status(200).json({ success: true, data: checklist });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const applicationId = req.params.id;
    const uploaderId = req.user!.id;
    const file = req.file;
    const documentType = req.body.documentType as DocumentType;

    if (!file) {
      res.status(400).json({ success: false, error: { message: 'No document file uploaded.', statusCode: 400 } });
      return;
    }

    if (!documentType) {
      res.status(400).json({ success: false, error: { message: 'DocumentType is required.', statusCode: 400 } });
      return;
    }

    const doc = await uploadApplicationDocument(institutionId, applicationId, uploaderId, file, documentType);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};

export const downloadDocumentFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const docId = req.params.docId;

    // Secure document lookup
    const doc = await prisma.applicationDocument.findUnique({
      where: { id: docId },
      include: { application: true },
    });

    if (!doc) {
      res.status(404).json({ success: false, error: { message: 'Document not found.', statusCode: 404 } });
      return;
    }

    // Tenant check: Institution users can ONLY access documents belonging to their institution
    if (req.user?.role === 'INSTITUTION_USER' && doc.institutionId !== req.user.institutionId) {
      res.status(403).json({ success: false, error: { message: 'Access denied to document belonging to another institution.', statusCode: 403 } });
      return;
    }

    const filePath = getStorageFilePath(doc.storageKey);
    if (!filePath) {
      res.status(404).json({ success: false, error: { message: 'Physical file not found on storage server.', statusCode: 404 } });
      return;
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

export const checkPreliminary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const checks = await runPreliminaryChecks(institutionId, req.params.id);
    res.status(200).json({ success: true, data: checks });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};

export const submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const userId = req.user!.id;
    const userFullName = req.user!.fullName;

    const result = await submitApplication(institutionId, req.params.id, userId, userFullName);
    res.status(200).json({
      success: true,
      data: {
        application: result,
        message: `Application submitted successfully. SAKSHAM Reference: ${result.applicationNumber}`,
      },
    });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
        },
      });
      return;
    }
    next(error);
  }
};

export const getDeficiencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const applicationId = req.query.applicationId as string | undefined;
    const notices = await getInstitutionDeficiencies(institutionId, applicationId);
    res.status(200).json({ success: true, data: notices });
  } catch (error) {
    next(error);
  }
};

export const respondDeficiency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const userId = req.user!.id;
    const userFullName = req.user!.fullName;
    const noticeId = req.params.id;
    const { responseText, documentRef } = req.body;

    if (!responseText || responseText.trim().length === 0) {
      res.status(400).json({ success: false, error: { message: 'Clarification response text is required.', statusCode: 400 } });
      return;
    }

    const updated = await respondToDeficiencyNotice(institutionId, noticeId, userId, userFullName, {
      responseText,
      documentRef,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};

export const getCompliance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const compliance = await getInstitutionCompliance(institutionId);
    res.status(200).json({ success: true, data: compliance });
  } catch (error) {
    next(error);
  }
};

export const submitCompliance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const userId = req.user!.id;
    const userFullName = req.user!.fullName;
    const complianceId = req.params.id;
    const { documentRef } = req.body;

    if (!documentRef) {
      res.status(400).json({ success: false, error: { message: 'Document reference is required.', statusCode: 400 } });
      return;
    }

    const updated = await submitComplianceEvidence(institutionId, complianceId, userId, userFullName, documentRef);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const notifications = await getInstitutionNotifications(institutionId);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.user!.institutionId!;
    const updated = await markNotificationAsRead(institutionId, req.params.id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof InstitutionError) {
      res.status(error.statusCode).json({ success: false, error: { message: error.message, statusCode: error.statusCode } });
      return;
    }
    next(error);
  }
};
