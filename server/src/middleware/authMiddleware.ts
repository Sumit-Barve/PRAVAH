import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { verifyAccessToken } from '../utils/security';
import { AuthenticatedUser, UserRole, Region } from '@saksham/shared';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Require valid authenticated user session.
 * Accepts session via HttpOnly cookie (saksham_token) or Authorization header (Bearer token).
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.saksham_token) {
      token = req.cookies.saksham_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please sign in.',
          statusCode: 401,
        },
      });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload || !payload.sub) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Session has expired or is invalid. Please sign in again.',
          statusCode: 401,
        },
      });
      return;
    }

    // Verify against authoritative database record
    const user = await prisma.systemUser.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        region: true,
        department: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
            permanentInstituteId: true,
            isVerified: true,
          },
        },
        isActive: true,
        isEmailVerified: true,
        tokenVersion: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User account not found.',
          statusCode: 401,
        },
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Account is deactivated. Access denied.',
          statusCode: 403,
        },
      });
      return;
    }

    // Check token version to guarantee instantaneous logout / session revocation
    if (user.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Session has been invalidated. Please sign in again.',
          statusCode: 401,
        },
      });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      region: user.region as Region | null,
      department: user.department,
      institutionId: user.institutionId,
      institutionName: user.institution?.name || null,
      permanentInstituteId: user.institution?.permanentInstituteId || null,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authoritative Server-Side Role-Based Access Control Middleware.
 * Rejects requests if authenticated user's role is not within permitted roles.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required prior to permission evaluation.',
          statusCode: 401,
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access forbidden for role '${req.user.role}'. Required role(s): ${allowedRoles.join(', ')}.`,
          statusCode: 403,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Ensures request is from an authenticated Institution User with a linked Institution.
 */
export const requireInstitution = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required.',
        statusCode: 401,
      },
    });
    return;
  }

  if (req.user.role !== 'INSTITUTION_USER' || !req.user.institutionId) {
    res.status(403).json({
      success: false,
      error: {
        message: 'Access restricted to authorized institutional representatives.',
        statusCode: 403,
      },
    });
    return;
  }

  next();
};

/**
 * Ensures request is from an authorized AICTE internal officer (NOT an institutional user).
 */
export const requireOfficer = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required.',
        statusCode: 401,
      },
    });
    return;
  }

  if (req.user.role === 'INSTITUTION_USER') {
    res.status(403).json({
      success: false,
      error: {
        message: 'Institutional users are not authorized to access internal officer workflows.',
        statusCode: 403,
      },
    });
    return;
  }

  next();
};

/**
 * Record-Level Regional Boundary Enforcement.
 * Ensures a Regional Officer cannot inspect or mutate records outside their jurisdiction.
 */
export const requireRegionalAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required.',
        statusCode: 401,
      },
    });
    return;
  }

  // Member Secretary, Scrutiny Officer (national pool), EVC Experts, and System Admins have national scope
  if (req.user.role === 'REGIONAL_OFFICER' && req.user.region) {
    const requestedRegion = (req.query.region || req.params.region || req.body?.region) as string | undefined;

    if (requestedRegion && requestedRegion.toUpperCase() !== req.user.region) {
      res.status(403).json({
        success: false,
        error: {
          message: `Jurisdiction violation: Regional Officer assigned to '${req.user.region}' cannot access '${requestedRegion}' records.`,
          statusCode: 403,
        },
      });
      return;
    }
  }

  next();
};

/**
 * CSRF Protection for State-Changing Requests.
 * Validates Origin and double-submit x-csrf-token header against saksham_csrf_token cookie.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Safe HTTP read methods are exempt
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // If request uses cookie-based authentication, CSRF token validation is mandatory
  if (req.cookies && req.cookies.saksham_token) {
    const cookieCsrfToken = req.cookies.saksham_csrf_token;
    const headerCsrfToken = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token']) as string | undefined;

    if (!cookieCsrfToken || !headerCsrfToken || cookieCsrfToken !== headerCsrfToken) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Cross-Site Request Forgery (CSRF) validation failed. Missing or mismatched CSRF token.',
          statusCode: 403,
        },
      });
      return;
    }
  }

  next();
};
