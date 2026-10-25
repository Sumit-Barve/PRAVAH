import { Request, Response, NextFunction } from 'express';
import { getEVCInspectionsFromDb } from '../services/evcService';
import { getComplianceItemsFromDb } from '../services/complianceService';
import { getDocumentValidityItemsFromDb } from '../services/documentService';
import { getAuditLogsFromDb } from '../services/auditService';

export const getEVCInspections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, region } = req.query;
    const result = await getEVCInspectionsFromDb({
      status: typeof status === 'string' ? status : undefined,
      region: typeof region === 'string' ? region : undefined,
    });
    res.status(200).json({ success: true, total: result.total, data: result.data });
  } catch (error) {
    next(error);
  }
};

export const getComplianceItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, overdueOnly } = req.query;
    const result = await getComplianceItemsFromDb({
      status: typeof status === 'string' ? status : undefined,
      overdueOnly: overdueOnly === 'true',
    });
    res.status(200).json({ success: true, total: result.total, data: result.data });
  } catch (error) {
    next(error);
  }
};

export const getDocumentValidityItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { validityStatus, documentType } = req.query;
    const result = await getDocumentValidityItemsFromDb({
      validityStatus: typeof validityStatus === 'string' ? validityStatus : undefined,
      documentType: typeof documentType === 'string' ? documentType : undefined,
    });
    res.status(200).json({ success: true, total: result.total, data: result.data });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityType, actorRole, limit } = req.query;
    const result = await getAuditLogsFromDb({
      entityType: typeof entityType === 'string' ? entityType : undefined,
      actorRole: typeof actorRole === 'string' ? actorRole : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.status(200).json({ success: true, total: result.total, data: result.data });
  } catch (error) {
    next(error);
  }
};
