import { Router } from 'express';
import { getRules } from '../controllers/rulesController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, getRules);

export default router;
