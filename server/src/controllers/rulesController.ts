import { Request, Response, NextFunction } from 'express';
import { getRegulatoryRulesFromDb } from '../services/rulesService';

export const getRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, verificationStatus } = req.query;

    const result = await getRegulatoryRulesFromDb({
      category: typeof category === 'string' ? category : undefined,
      verificationStatus: typeof verificationStatus === 'string' ? verificationStatus : undefined,
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
