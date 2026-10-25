import { Request, Response, NextFunction } from 'express';
import { getDashboardMetricsFromDb } from '../services/metricsService';

export const getMetrics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await getDashboardMetricsFromDb();
    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};
