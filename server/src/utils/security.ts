import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { CookieOptions } from 'express';
import { UserRole, Region } from '@saksham/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'saksham_fallback_dev_secret_32_characters_long!';
const IS_PROD = process.env.NODE_ENV === 'production';

export interface TokenPayload {
  sub: string; // User ID
  username: string;
  role: UserRole;
  region?: Region | null;
  tokenVersion: number;
}

/**
 * Hashes a password using Argon2id with OWASP-recommended parameters.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

/**
 * Generates an 8-hour signed JWT access token.
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '8h',
    algorithm: 'HS256',
  });
}

/**
 * Verifies an access token and returns its decoded payload.
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Generates a random cryptographic CSRF token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * HttpOnly Authentication Cookie Configuration
 */
export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  };
}

/**
 * Client-accessible CSRF Cookie Configuration
 */
export function getCsrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false, // Must be readable by client JavaScript to set x-csrf-token header
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}
