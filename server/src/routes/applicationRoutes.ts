import { Router } from 'express';
import {
  getApplications,
  getApplicationById,
  createDeficiency,
  releaseDeficiency,
  reviewDeficiency,
  transitionStage,
} from '../controllers/applicationController';
import { requireAuth, requireOfficer, requireRegionalAccess, requireRole } from '../middleware/authMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Internal Officer Application Endpoints
router.get('/', requireAuth, requireOfficer, requireRegionalAccess, getApplications);
router.get('/:id', requireAuth, requireOfficer, getApplicationById);

// Deficiency Notice Management (Scrutiny Officers & Committee)
router.post(
  '/:id/deficiencies',
  requireAuth,
  requireRole(UserRole.SCRUTINY_OFFICER, UserRole.REGIONAL_OFFICER, UserRole.SAC_SHC_MEMBER, UserRole.SYSTEM_ADMIN),
  createDeficiency
);

router.post(
  '/:id/deficiencies/:noticeId/release',
  requireAuth,
  requireRole(UserRole.SCRUTINY_OFFICER, UserRole.REGIONAL_OFFICER, UserRole.SAC_SHC_MEMBER, UserRole.SYSTEM_ADMIN),
  releaseDeficiency
);

router.post(
  '/:id/deficiencies/:noticeId/review',
  requireAuth,
  requireRole(UserRole.SCRUTINY_OFFICER, UserRole.REGIONAL_OFFICER, UserRole.SAC_SHC_MEMBER, UserRole.SYSTEM_ADMIN),
  reviewDeficiency
);

// Workflow Stage Transition (Regional Officers, Member Secretary, System Admin)
router.patch(
  '/:id/stage',
  requireAuth,
  requireRole(UserRole.REGIONAL_OFFICER, UserRole.MEMBER_SECRETARY, UserRole.SYSTEM_ADMIN),
  transitionStage
);

export default router;
