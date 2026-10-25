import { Request, Response, NextFunction } from 'express';
import {
  getApplicationsFromDb,
  getApplicationByIdFromDb,
  transitionApplicationStage,
} from '../services/applicationService';
import {
  createDraftDeficiencyNotice,
  releaseDeficiencyNotice,
  reviewDeficiencyResponse,
} from '../services/deficiencyService';
import { ApplicationStage, UserRole } from '@prisma/client';

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, stage, region, priority, category, limit, offset } = req.query;

    let effectiveRegion = typeof region === 'string' ? region : undefined;

    // Enforce Regional Boundary for Regional Officers
    if (req.user?.role === 'REGIONAL_OFFICER' && req.user.region) {
      if (effectiveRegion && effectiveRegion.toUpperCase() !== req.user.region) {
        res.status(403).json({
          success: false,
          error: {
            message: `Jurisdiction violation: Regional Officer assigned to '${req.user.region}' cannot query '${effectiveRegion}' records.`,
            statusCode: 403,
          },
        });
        return;
      }
      effectiveRegion = req.user.region;
    }

    const result = await getApplicationsFromDb({
      search: typeof search === 'string' ? search : undefined,
      stage: typeof stage === 'string' ? stage : undefined,
      region: effectiveRegion,
      priority: typeof priority === 'string' ? priority : undefined,
      category: typeof category === 'string' ? category : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json({
      success: true,
      total: result.total,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid or missing application identifier parameter.', statusCode: 400 },
      });
      return;
    }

    const application = await getApplicationByIdFromDb(id);

    if (!application) {
      res.status(404).json({
        success: false,
        error: { message: `Application with ID or number '${id}' not found in database.`, statusCode: 404 },
      });
      return;
    }

    // Record-Level Regional Access Enforcement
    if (req.user?.role === 'REGIONAL_OFFICER' && req.user.region) {
      if (application.region !== req.user.region) {
        res.status(403).json({
          success: false,
          error: {
            message: `Access denied: Regional Officer assigned to '${req.user.region}' cannot view application belonging to '${application.region}'.`,
            statusCode: 403,
          },
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const createDeficiency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { parameterName, requirementRef, title, description, dueDate } = req.body;

    if (!title || !description || !parameterName) {
      res.status(400).json({
        success: false,
        error: { message: 'Title, description, and parameterName are required.', statusCode: 400 },
      });
      return;
    }

    const notice = await createDraftDeficiencyNotice({
      applicationId: id,
      parameterName,
      requirementRef: requirementRef || 'APH 2024-27 Scrutiny Norms',
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      officerId: req.user!.id,
      officerName: req.user!.fullName,
      officerRole: req.user!.role as UserRole,
    });

    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

export const releaseDeficiency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noticeId } = req.params;

    const notice = await releaseDeficiencyNotice(
      noticeId,
      req.user!.id,
      req.user!.fullName,
      req.user!.role as UserRole
    );

    res.status(200).json({
      success: true,
      data: notice,
      message: `Deficiency notice ${notice.noticeNumber} formally released to institution.`,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewDeficiency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noticeId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!status || !reviewNotes) {
      res.status(400).json({
        success: false,
        error: { message: 'Status (RESOLVED_SATISFIED | REJECTED_UNSATISFACTORY) and reviewNotes are required.', statusCode: 400 },
      });
      return;
    }

    const notice = await reviewDeficiencyResponse(
      noticeId,
      req.user!.id,
      req.user!.fullName,
      req.user!.role as UserRole,
      { status, reviewNotes }
    );

    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

export const transitionStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newStage, remarks } = req.body;

    if (!newStage || !Object.values(ApplicationStage).includes(newStage)) {
      res.status(400).json({
        success: false,
        error: { message: `Invalid stage. Valid stages: ${Object.values(ApplicationStage).join(', ')}`, statusCode: 400 },
      });
      return;
    }

    const updated = await transitionApplicationStage(
      id,
      newStage as ApplicationStage,
      req.user!.id,
      req.user!.fullName,
      req.user!.role as UserRole,
      remarks
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
