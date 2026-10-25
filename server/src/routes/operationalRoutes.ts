import { Router } from 'express';
import {
  getEVCInspections,
  getComplianceItems,
  getDocumentValidityItems,
  getAuditLogs,
} from '../controllers/operationalControllers';
import { requireAuth, requireRole, requireRegionalAccess } from '../middleware/authMiddleware';

const router = Router();

// EVC Inspections: EVC personnel, Regional Officers, Member Secretary, System Admin
router.get(
  '/evc',
  requireAuth,
  requireRole('MEMBER_SECRETARY', 'REGIONAL_OFFICER', 'EVC_CONVENER', 'EVC_EXPERT', 'SYSTEM_ADMIN'),
  requireRegionalAccess,
  getEVCInspections
);

// Compliance Deficiencies: Scrutiny Officers, Regional Officers, Member Secretary, System Admin
router.get(
  '/compliance',
  requireAuth,
  requireRole('MEMBER_SECRETARY', 'REGIONAL_OFFICER', 'SCRUTINY_OFFICER', 'SYSTEM_ADMIN'),
  getComplianceItems
);

// Document Validity Tracking: Scrutiny Officers, Regional Officers, Member Secretary, System Admin
router.get(
  '/documents',
  requireAuth,
  requireRole('MEMBER_SECRETARY', 'REGIONAL_OFFICER', 'SCRUTINY_OFFICER', 'SYSTEM_ADMIN'),
  getDocumentValidityItems
);

// Audit Trails: Member Secretary and System Admin ONLY (Separation of duties safeguard)
router.get(
  '/audit',
  requireAuth,
  requireRole('MEMBER_SECRETARY', 'SYSTEM_ADMIN'),
  getAuditLogs
);

export default router;
