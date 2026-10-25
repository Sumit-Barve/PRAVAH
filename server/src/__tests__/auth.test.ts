import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../db/prisma';
import { hashPassword, verifyPassword } from '../utils/security';

function extractCookie(res: request.Response, prefix: string): string {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return '';
  const list = Array.isArray(cookies) ? cookies : [cookies];
  return list.find((c: string) => c.startsWith(prefix)) || '';
}

function extractAllCookies(res: request.Response): string[] {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  return Array.isArray(cookies) ? cookies : [cookies];
}

describe('SAKSHAM Authentication & Authorization (Phase 3A)', () => {
  const app = createApp();
  const demoPassword = process.env.DEMO_USER_PASSWORD || 'AicteDev@2026!';

  beforeAll(async () => {
    // Ensure test users exist with known Argon2id hashed passwords
    const hashed = await hashPassword(demoPassword);

    await prisma.systemUser.upsert({
      where: { username: 'test.admin' },
      update: {
        passwordHash: hashed,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        id: 'usr-test-admin',
        username: 'test.admin',
        email: 'test.admin@aicte-india.org',
        fullName: 'Prof. Test Secretary',
        role: 'MEMBER_SECRETARY',
        department: 'Member Secretary Secretariat',
        passwordHash: hashed,
        isActive: true,
      },
    });

    await prisma.systemUser.upsert({
      where: { username: 'test.scrutiny' },
      update: {
        passwordHash: hashed,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        id: 'usr-test-scrutiny',
        username: 'test.scrutiny',
        email: 'test.scrutiny@aicte-india.org',
        fullName: 'Dr. Test Scrutiny Officer',
        role: 'SCRUTINY_OFFICER',
        department: 'Bureau of Approval',
        passwordHash: hashed,
        isActive: true,
      },
    });

    await prisma.systemUser.upsert({
      where: { username: 'test.ro' },
      update: {
        passwordHash: hashed,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        region: 'NORTHERN',
      },
      create: {
        id: 'usr-test-ro',
        username: 'test.ro',
        email: 'test.ro@aicte-india.org',
        fullName: 'Regional Officer North',
        role: 'REGIONAL_OFFICER',
        region: 'NORTHERN',
        department: 'Northern Regional Office',
        passwordHash: hashed,
        isActive: true,
      },
    });

    await prisma.systemUser.upsert({
      where: { username: 'test.disabled' },
      update: {
        passwordHash: hashed,
        isActive: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      create: {
        id: 'usr-test-disabled',
        username: 'test.disabled',
        email: 'test.disabled@aicte-india.org',
        fullName: 'Deactivated User',
        role: 'SCRUTINY_OFFICER',
        passwordHash: hashed,
        isActive: false,
      },
    });
  });

  describe('Password Hashing & Integrity', () => {
    it('should hash passwords using Argon2id with secure memory and time parameters', async () => {
      const plain = 'TestPassword123!';
      const hash = await hashPassword(plain);

      expect(hash).toMatch(/^\$argon2id\$v=19\$m=65536/);
      expect(await verifyPassword(hash, plain)).toBe(true);
      expect(await verifyPassword(hash, 'WrongPassword123!')).toBe(false);
    });
  });

  describe('Authentication Boundary: POST /api/auth/login', () => {
    it('should successfully authenticate valid officer credentials and set HttpOnly cookies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'test.admin',
          password: demoPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('test.admin');
      expect(res.body.data.user.role).toBe('MEMBER_SECRETARY');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');

      const tokenCookie = extractCookie(res, 'saksham_token=');
      expect(tokenCookie).toBeTruthy();
      expect(tokenCookie).toContain('HttpOnly');

      const csrfCookie = extractCookie(res, 'saksham_csrf_token=');
      expect(csrfCookie).toBeTruthy();
    });

    it('should reject invalid password with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'test.admin',
          password: 'IncorrectPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid username or password');
    });

    it('should reject non-existent username with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'unknown.ghost.user',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid username or password');
    });

    it('should reject deactivated account with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: 'test.disabled',
          password: demoPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('deactivated');
    });
  });

  describe('Session Verification & Restoration: GET /api/auth/me', () => {
    it('should restore session from valid HttpOnly saksham_token cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [tokenCookie]);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.username).toBe('test.admin');
      expect(meRes.body.data.user.role).toBe('MEMBER_SECRETARY');
    });

    it('should reject unauthenticated request to /api/auth/me with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject tampered or invalid token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['saksham_token=tampered.token.value; Path=/']);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Logout & Session Revocation: POST /api/auth/logout', () => {
    it('should clear cookies and invalidate token version in database', async () => {
      // 1. Log in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');
      const csrfCookie = extractCookie(loginRes, 'saksham_csrf_token=');
      const csrfToken = csrfCookie.split(';')[0].split('=')[1];

      // 2. Log out
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [tokenCookie, csrfCookie])
        .set('x-csrf-token', csrfToken);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify clear-cookie headers
      const logoutCookies = extractAllCookies(logoutRes);
      expect(logoutCookies.some((c: string) => c.includes('saksham_token=;'))).toBe(true);

      // 3. Attempting to use the old token must now be rejected (tokenVersion mismatch)
      const reuseRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [tokenCookie]);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.error.message).toContain('invalidated');
    });
  });

  describe('Authoritative Server-Side RBAC Enforcement', () => {
    it('should permit MEMBER_SECRETARY to access /api/audit', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      const auditRes = await request(app)
        .get('/api/audit')
        .set('Cookie', [tokenCookie]);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.success).toBe(true);
      expect(Array.isArray(auditRes.body.data)).toBe(true);
    });

    it('should forbid SCRUTINY_OFFICER from accessing /api/audit', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.scrutiny', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      const auditRes = await request(app)
        .get('/api/audit')
        .set('Cookie', [tokenCookie]);

      expect(auditRes.status).toBe(403);
      expect(auditRes.body.success).toBe(false);
      expect(auditRes.body.error.message).toContain("Access forbidden for role 'SCRUTINY_OFFICER'");
    });

    it('should ignore role forgery attempts sent via request payload or headers', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.scrutiny', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      const forgedRes = await request(app)
        .get('/api/audit')
        .set('Cookie', [tokenCookie])
        .set('X-User-Role', 'MEMBER_SECRETARY')
        .send({ role: 'MEMBER_SECRETARY', userRole: 'SYSTEM_ADMIN' });

      // Must remain forbidden because authoritative server session dictates permissions
      expect(forgedRes.status).toBe(403);
      expect(forgedRes.body.success).toBe(false);
    });
  });

  describe('Record-Level Regional Access Enforcement', () => {
    it('should prevent Regional Officer from accessing records from a different region', async () => {
      // Login as test.ro (NORTHERN region)
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.ro', password: demoPassword });

      expect(loginRes.status).toBe(200);
      const tokenCookie = extractCookie(loginRes, 'saksham_token=');

      // Attempts to query WESTERN region records
      const foreignRes = await request(app)
        .get('/api/applications?region=WESTERN')
        .set('Cookie', [tokenCookie]);

      expect(foreignRes.status).toBe(403);
      expect(foreignRes.body.error.message).toContain('Jurisdiction violation');

      // Queries their own region records
      const ownRes = await request(app)
        .get('/api/applications?region=NORTHERN')
        .set('Cookie', [tokenCookie]);

      expect(ownRes.status).toBe(200);
      expect(ownRes.body.success).toBe(true);
    });
  });

  describe('Cross-Site Request Forgery (CSRF) Protection', () => {
    it('should reject state-changing cookie requests missing x-csrf-token header', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');
      const csrfCookie = extractCookie(loginRes, 'saksham_csrf_token=');

      // Send POST without x-csrf-token header
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [tokenCookie, csrfCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('CSRF');
    });

    it('should reject state-changing cookie requests with mismatched x-csrf-token header', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'test.admin', password: demoPassword });

      const tokenCookie = extractCookie(loginRes, 'saksham_token=');
      const csrfCookie = extractCookie(loginRes, 'saksham_csrf_token=');

      // Send POST with forged x-csrf-token header
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [tokenCookie, csrfCookie])
        .set('x-csrf-token', 'forged-token-value-12345678');

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('CSRF');
    });
  });
});
