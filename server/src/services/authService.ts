import { prisma } from '../db/prisma';
import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateCsrfToken,
} from '../utils/security';
import { recordAuditEvent } from './auditService';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';
import { UserRole, Region, InstitutionType } from '@prisma/client';

export interface LoginParams {
  usernameOrEmail: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResult {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    region: Region | null;
    department: string | null;
    institutionId?: string | null;
    institutionName?: string | null;
    permanentInstituteId?: string | null;
    isActive: boolean;
    isEmailVerified?: boolean;
    lastLoginAt: string | null;
  };
  token: string;
  csrfToken: string;
}

export interface RegisterInstitutionParams {
  institutionName: string;
  trustName: string;
  institutionType?: InstitutionType;
  region?: Region;
  state: string;
  district?: string;
  address?: string;
  pincode?: string;
  permanentInstituteId?: string;
  representativeName: string;
  email: string;
  mobilePhone?: string;
  password: string;
  ipAddress?: string;
}

// Precomputed dummy Argon2id hash for constant-time comparison on unknown users
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=1$c2FtcGxlc2FsdDEyMzQ1Ng$q3Yx4K9x7J5zZ0uM8c9kL1mN2oP3qR4sT5uV6wX7yZ0';

export class AuthenticationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
  }
}

export const loginUser = async (params: LoginParams): Promise<AuthResult> => {
  const identifier = params.usernameOrEmail.trim().toLowerCase();
  const password = params.password;
  const rawIp = params.ipAddress || '127.0.0.1';
  const maskedIp = rawIp.includes('.')
    ? rawIp.split('.').slice(0, 3).join('.') + '.xxx'
    : 'masked-ip';

  // Find user by username or email
  const user = await prisma.systemUser.findFirst({
    where: {
      OR: [
        { username: { equals: identifier, mode: 'insensitive' } },
        { email: { equals: identifier, mode: 'insensitive' } },
      ],
    },
    include: {
      institution: true,
    },
  });

  if (!user) {
    // Perform dummy timing mitigation
    await verifyPassword(DUMMY_HASH, password);
    await recordAuditEvent({
      actorId: 'anonymous',
      actorName: identifier,
      actorRole: UserRole.SYSTEM_ADMIN,
      actionCode: 'AUTH_LOGIN_FAILED',
      actionTitle: 'Failed Login Attempt (Unknown User)',
      entityType: 'AUTHENTICATION',
      entityId: identifier,
      details: `Failed sign-in attempt for non-existent identifier '${identifier}'`,
      ipAddressMasked: maskedIp,
    });
    throw new AuthenticationError('Invalid username or password', 401);
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
    await recordAuditEvent({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      actionCode: 'AUTH_ACCOUNT_LOCKED_ATTEMPT',
      actionTitle: 'Login Attempt on Locked Account',
      entityType: 'AUTHENTICATION',
      entityId: user.id,
      details: `Sign-in attempt on locked account '${user.username}'. Lock expires in ${minutesLeft} minute(s).`,
      ipAddressMasked: maskedIp,
    });
    throw new AuthenticationError(
      `Account is temporarily locked due to multiple failed attempts. Please retry in ${minutesLeft} minute(s).`,
      423 // Locked
    );
  }

  // Check if account is active
  if (!user.isActive) {
    await recordAuditEvent({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      actionCode: 'AUTH_ACCOUNT_DISABLED',
      actionTitle: 'Login Attempt on Disabled Account',
      entityType: 'AUTHENTICATION',
      entityId: user.id,
      details: `Sign-in rejected for deactivated account '${user.username}'`,
      ipAddressMasked: maskedIp,
    });
    throw new AuthenticationError(
      'Account has been deactivated. Please contact AICTE e-Governance Division.',
      403 // Forbidden
    );
  }

  // Verify Argon2id password hash
  const isValidPassword = await verifyPassword(user.passwordHash, password);

  if (!isValidPassword) {
    const updatedAttempts = user.failedLoginAttempts + 1;
    const shouldLock = updatedAttempts >= 5;
    const lockDurationMs = 15 * 60 * 1000; // 15 minutes lockout

    await prisma.systemUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: updatedAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + lockDurationMs) : null,
      },
    });

    await recordAuditEvent({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      actionCode: shouldLock ? 'AUTH_ACCOUNT_LOCKED' : 'AUTH_LOGIN_FAILED',
      actionTitle: shouldLock ? 'Account Locked (5 Failed Attempts)' : 'Failed Login Attempt (Invalid Password)',
      entityType: 'AUTHENTICATION',
      entityId: user.id,
      details: shouldLock
        ? `Account '${user.username}' locked for 15 minutes following 5 consecutive failed passwords.`
        : `Invalid password supplied for user '${user.username}' (Attempt ${updatedAttempts}/5).`,
      ipAddressMasked: maskedIp,
    });

    throw new AuthenticationError('Invalid username or password', 401);
  }

  // Login successful: reset failed attempts, update lastLoginAt
  const updatedUser = await prisma.systemUser.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
    include: {
      institution: true,
    },
  });

  await recordAuditEvent({
    actorId: updatedUser.id,
    actorName: updatedUser.fullName,
    actorRole: updatedUser.role,
    actionCode: 'AUTH_LOGIN_SUCCESS',
    actionTitle: `${updatedUser.role === UserRole.INSTITUTION_USER ? 'Institution Representative' : 'Officer'} Authentication Successful`,
    entityType: 'AUTHENTICATION',
    entityId: updatedUser.id,
    details: `'${updatedUser.fullName}' authenticated successfully with role '${updatedUser.role}'.`,
    ipAddressMasked: maskedIp,
  });

  const token = generateAccessToken({
    sub: updatedUser.id,
    username: updatedUser.username,
    role: updatedUser.role as any,
    region: updatedUser.region as any,
    tokenVersion: updatedUser.tokenVersion,
  });

  const csrfToken = generateCsrfToken();

  return {
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      region: updatedUser.region,
      department: updatedUser.department,
      institutionId: updatedUser.institutionId,
      institutionName: updatedUser.institution?.name || null,
      permanentInstituteId: updatedUser.institution?.permanentInstituteId || null,
      isActive: updatedUser.isActive,
      isEmailVerified: updatedUser.isEmailVerified,
      lastLoginAt: updatedUser.lastLoginAt ? updatedUser.lastLoginAt.toISOString() : null,
    },
    token,
    csrfToken,
  };
};

/**
 * Registers a new Institutional Representative and creates or links the Institution record.
 */
export const registerInstitutionUser = async (params: RegisterInstitutionParams): Promise<{
  userId: string;
  institutionId: string;
  email: string;
  isEmailVerified: boolean;
  message: string;
}> => {
  const email = params.email.trim().toLowerCase();
  const rawIp = params.ipAddress || '127.0.0.1';
  const maskedIp = rawIp.includes('.')
    ? rawIp.split('.').slice(0, 3).join('.') + '.xxx'
    : 'masked-ip';

  // 1. Check if user email is already registered
  const existingUser = await prisma.systemUser.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (existingUser) {
    throw new AuthenticationError('An account with this email address already exists. Please log in or use password reset.', 409);
  }

  // 2. Validate password strength (minimum 8 characters)
  if (params.password.length < 8) {
    throw new AuthenticationError('Password must be at least 8 characters long.', 400);
  }

  // 3. Resolve or create Institution
  let institution = null;
  const pid = params.permanentInstituteId?.trim();

  if (pid) {
    institution = await prisma.institution.findUnique({
      where: { permanentInstituteId: pid },
    });
  }

  if (!institution) {
    // Generate new SAKSHAM Temporary/Permanent ID if not provided
    const randomPid = pid || `1-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const defaultRegion = params.region || Region.NORTH_WEST;
    const defaultType = params.institutionType || InstitutionType.PRIVATE_SELF_FINANCED;

    institution = await prisma.institution.create({
      data: {
        permanentInstituteId: randomPid,
        name: params.institutionName.trim(),
        trustName: params.trustName.trim(),
        institutionType: defaultType,
        region: defaultRegion,
        state: params.state.trim(),
        district: params.district?.trim() || null,
        address: params.address?.trim() || null,
        pincode: params.pincode?.trim() || null,
        contactEmail: email,
        contactPhone: params.mobilePhone?.trim() || null,
        isVerified: true, // Activated for seamless SIH demonstration
      },
    });
  }

  // 4. Hash password with Argon2id
  const passwordHash = await hashPassword(params.password);

  // 5. Generate secure email verification token (valid 24h)
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // 6. Create Institutional User
  const newUser = await prisma.systemUser.create({
    data: {
      username: email,
      email: email,
      fullName: params.representativeName.trim(),
      role: UserRole.INSTITUTION_USER,
      institutionId: institution.id,
      region: institution.region,
      department: 'Institutional Representative Desk',
      passwordHash,
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    },
  });

  // 7. Dispatch verification email (or log to dev outbox)
  await sendVerificationEmail(email, newUser.fullName, emailVerificationToken);

  // 8. Audit event
  await recordAuditEvent({
    actorId: newUser.id,
    actorName: newUser.fullName,
    actorRole: UserRole.INSTITUTION_USER,
    actionCode: 'INSTITUTION_REGISTRATION',
    actionTitle: 'Institution Representative Registration',
    entityType: 'INSTITUTION',
    entityId: institution.id,
    details: `Representative '${newUser.fullName}' registered for '${institution.name}' (PID: ${institution.permanentInstituteId}).`,
    ipAddressMasked: maskedIp,
  });

  return {
    userId: newUser.id,
    institutionId: institution.id,
    email: newUser.email,
    isEmailVerified: false,
    message: 'Registration successful. A verification link has been sent to your institutional email.',
  };
};

/**
 * Confirms an email address using a cryptographic token.
 */
export const verifyEmailToken = async (token: string): Promise<{ success: boolean; message: string }> => {
  if (!token || token.trim().length === 0) {
    throw new AuthenticationError('Verification token is missing.', 400);
  }

  const user = await prisma.systemUser.findFirst({
    where: {
      emailVerificationToken: token.trim(),
      emailVerificationExpires: { gt: new Date() },
    },
    include: { institution: true },
  });

  if (!user) {
    throw new AuthenticationError('Verification link is invalid or has expired. Please request a new verification link.', 400);
  }

  await prisma.systemUser.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  await recordAuditEvent({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    actionCode: 'AUTH_EMAIL_VERIFIED',
    actionTitle: 'Institutional Email Address Verified',
    entityType: 'AUTHENTICATION',
    entityId: user.id,
    details: `Email address '${user.email}' verified successfully.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return {
    success: true,
    message: 'Institutional email address verified successfully. You may now sign in.',
  };
};

/**
 * Initiates a password reset workflow.
 */
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.systemUser.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  // Always return the same message to prevent account enumeration
  const standardMsg = 'If the email is registered on SAKSHAM, password reset instructions have been dispatched.';

  if (!user || !user.isActive) {
    return { success: true, message: standardMsg };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.systemUser.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expires,
    },
  });

  await sendPasswordResetEmail(user.email, user.fullName, token);

  return { success: true, message: standardMsg };
};

/**
 * Consumes a password reset token and sets a new password.
 */
export const resetPasswordWithToken = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  if (!token || token.trim().length === 0) {
    throw new AuthenticationError('Password reset token is missing.', 400);
  }

  if (newPassword.length < 8) {
    throw new AuthenticationError('Password must be at least 8 characters long.', 400);
  }

  const user = await prisma.systemUser.findFirst({
    where: {
      passwordResetToken: token.trim(),
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthenticationError('Password reset link is invalid or has expired.', 400);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.systemUser.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: { increment: 1 }, // Invalidate any existing sessions
    },
  });

  await recordAuditEvent({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    actionCode: 'AUTH_PASSWORD_RESET',
    actionTitle: 'Account Password Successfully Reset',
    entityType: 'AUTHENTICATION',
    entityId: user.id,
    details: `Password reset successfully via token for '${user.email}'.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return {
    success: true,
    message: 'Your password has been reset successfully. Please sign in with your new credentials.',
  };
};

export const logoutUser = async (userId: string, rawIp: string = '127.0.0.1'): Promise<void> => {
  const maskedIp = rawIp.includes('.')
    ? rawIp.split('.').slice(0, 3).join('.') + '.xxx'
    : 'masked-ip';

  const user = await prisma.systemUser.findUnique({ where: { id: userId } });

  if (user) {
    // Increment tokenVersion to revoke active tokens
    await prisma.systemUser.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    await recordAuditEvent({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      actionCode: 'AUTH_LOGOUT',
      actionTitle: `${user.role === UserRole.INSTITUTION_USER ? 'Institution Representative' : 'Officer'} Session Terminated`,
      entityType: 'AUTHENTICATION',
      entityId: user.id,
      details: `'${user.fullName}' signed out. Token version invalidated.`,
      ipAddressMasked: maskedIp,
    });
  }
};

export const getAuthenticatedUserProfile = async (userId: string) => {
  const user = await prisma.systemUser.findUnique({
    where: { id: userId },
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
          state: true,
          region: true,
        },
      },
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError('User session is invalid or account is inactive.', 401);
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    region: user.region,
    department: user.department,
    institutionId: user.institutionId,
    institutionName: user.institution?.name || null,
    permanentInstituteId: user.institution?.permanentInstituteId || null,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
};
