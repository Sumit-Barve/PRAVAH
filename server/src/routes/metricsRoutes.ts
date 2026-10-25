import { Router } from 'express';
import { getMetrics } from '../controllers/metricsController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, getMetrics);

export default router;
