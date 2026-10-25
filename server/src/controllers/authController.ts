import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  loginUser,
  logoutUser,
  getAuthenticatedUserProfile,
  registerInstitutionUser,
  verifyEmailToken,
  requestPasswordReset,
  resetPasswordWithToken,
  AuthenticationError,
} from '../services/authService';
import { getDevOutbox } from '../services/emailService';
import { getAuthCookieOptions, getCsrfCookieOptions, generateCsrfToken } from '../utils/security';
import { Region, InstitutionType } from '@prisma/client';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required').max(100),
  password: z.string().min(1, 'Password is required').max(128),
});

const registerSchema = z.object({
  institutionName: z.string().min(3, 'Institution name must be at least 3 characters'),
  trustName: z.string().min(3, 'Trust / Society name must be at least 3 characters'),
  institutionType: z.nativeEnum(InstitutionType).optional(),
  region: z.nativeEnum(Region).optional(),
  state: z.string().min(2, 'State is required'),
  district: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  permanentInstituteId: z.string().optional(),
  representativeName: z.string().min(2, 'Representative name is required'),
  email: z.string().email('Valid institutional email is required'),
  mobilePhone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'New password must be at least 8 characters'),
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid login payload. Username and password are required.',
          statusCode: 400,
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const { usernameOrEmail, password } = parseResult.data;
    const authResult = await loginUser({
      usernameOrEmail,
      password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Set secure authentication cookies
    res.cookie('saksham_token', authResult.token, getAuthCookieOptions());
    res.cookie('saksham_csrf_token', authResult.csrfToken, getCsrfCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        user: authResult.user,
        csrfToken: authResult.csrfToken,
        message: `Welcome, ${authResult.user.fullName}. Authentication successful.`,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode,
        },
      });
      return;
    }
    next(error);
  }
};

export const registerInstitution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed for institution registration.',
          statusCode: 400,
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const result = await registerInstitutionUser({
      ...parseResult.data,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode,
        },
      });
      return;
    }
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = verifyEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Verification token is required.',
          statusCode: 400,
        },
      });
      return;
    }

    const result = await verifyEmailToken(parseResult.data.token);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode,
        },
      });
      return;
    }
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Valid institutional email is required.',
          statusCode: 400,
        },
      });
      return;
    }

    const result = await requestPasswordReset(parseResult.data.email);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Token and new password (min 8 chars) are required.',
          statusCode: 400,
        },
      });
      return;
    }

    const result = await resetPasswordWithToken(parseResult.data.token, parseResult.data.password);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode,
        },
      });
      return;
    }
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.id) {
      await logoutUser(req.user.id, req.ip);
    }

    res.clearCookie('saksham_token', { path: '/' });
    res.clearCookie('saksham_csrf_token', { path: '/' });

    res.status(200).json({
      success: true,
      data: {
        message: 'Session successfully terminated.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated.',
          statusCode: 401,
        },
      });
      return;
    }

    const profile = await getAuthenticatedUserProfile(req.user.id);

    if (!req.cookies?.saksham_csrf_token) {
      const newCsrf = generateCsrfToken();
      res.cookie('saksham_csrf_token', newCsrf, getCsrfCookieOptions());
    }

    res.status(200).json({
      success: true,
      data: {
        user: profile,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode,
        },
      });
      return;
    }
    next(error);
  }
};

export const getDevEmails = async (_req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ success: false, error: { message: 'Forbidden in production.', statusCode: 403 } });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      outbox: getDevOutbox(),
    },
  });
};
