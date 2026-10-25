import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  logout,
  getMe,
  registerInstitution,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getDevEmails,
} from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Rate limiter for authentication attempts: max 15 attempts per 15 minutes per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
  message: {
    success: false,
    error: {
      message: 'Too many sign-in attempts from this network. Please retry after 15 minutes.',
      statusCode: 429,
    },
  },
});

router.post('/login', loginRateLimiter, login);
router.post('/register-institution', registerInstitution);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

// Dev email inspection endpoint (disabled in production)
router.get('/dev-outbox', getDevEmails);

export default router;
