import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../db/prisma';
import { DocumentType } from '@prisma/client';

function extractAllCookies(res: request.Response): string[] {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  return (Array.isArray(cookies) ? cookies : [cookies]).map((c: string) => c.split(';')[0]);
}

describe('SAKSHAM Two-Sided Platform & Institution Workflow Integration', () => {
  const app = createApp();

  const testEmail = `test.institute.${Date.now()}@edu.gov.in`;
  const testPassword = 'SecurePassword@2026!';
  let institutionId: string;
  let verificationToken: string;
  let institutionCookies: string[] = [];
  let institutionCsrfToken: string = '';
  let createdDraftId: string = '';
  let officialAppNumber: string = '';

  let officerCookies: string[] = [];
  let officerCsrfToken: string = '';

  beforeAll(async () => {
    // Authenticate demo officer for scrutiny tests
    const officerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        usernameOrEmail: 'rk.sharma@aicte.gov.in',
        password: process.env.DEMO_USER_PASSWORD || 'AicteDev@2026!',
      });

    expect(officerLoginRes.status).toBe(200);
    officerCookies = extractAllCookies(officerLoginRes);
    officerCsrfToken = officerLoginRes.body.data.csrfToken;
  });

  describe('1. Institutional Registration & Email Verification Lifecycle', () => {
    it('should register a new institutional representative', async () => {
      const res = await request(app)
        .post('/api/auth/register-institution')
        .send({
          institutionName: 'Apex Institute of Technological Excellence',
          trustName: 'Apex Educational Charitable Trust',
          state: 'Maharashtra',
          district: 'Pune',
          permanentInstituteId: `1-${Math.floor(1000000 + Math.random() * 9000000)}`,
          representativeName: 'Dr. Vikram Malhotra',
          email: testEmail,
          mobilePhone: '+91 9876543210',
          password: testPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
      expect(res.body.data.isEmailVerified).toBe(false);
      institutionId = res.body.data.institutionId;

      // Fetch user from DB to verify token generation
      const user = await prisma.systemUser.findUnique({
        where: { id: res.body.data.userId },
      });
      expect(user).not.toBeNull();
      expect(user?.emailVerificationToken).toBeDefined();
      verificationToken = user!.emailVerificationToken!;
    });

    it('should reject duplicate registration with identical email', async () => {
      const res = await request(app)
        .post('/api/auth/register-institution')
        .send({
          institutionName: 'Another College',
          trustName: 'Another Trust',
          state: 'Delhi',
          representativeName: 'Duplicate Test',
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already exists');
    });

    it('should verify email with valid verification token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await prisma.systemUser.findFirst({
        where: { email: testEmail },
      });
      expect(user?.isEmailVerified).toBe(true);
      expect(user?.emailVerificationToken).toBeNull();
    });

    it('should reject invalid or expired verification token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'bogus-verification-token-xyz' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should authenticate institutional user with correct credentials and return institution metadata', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          usernameOrEmail: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('INSTITUTION_USER');
      expect(res.body.data.user.institutionId).toBe(institutionId);
      expect(res.body.data.user.institutionName).toBe('Apex Institute of Technological Excellence');

      institutionCookies = extractAllCookies(res);
      institutionCsrfToken = res.body.data.csrfToken;
    });
  });

  describe('2. Institution Portal Tenant Boundaries & Protected Access', () => {
    it('should reject unauthenticated request to /api/institution/profile', async () => {
      const res = await request(app).get('/api/institution/profile');
      expect(res.status).toBe(401);
    });

    it('should forbid officer role from accessing /api/institution/profile', async () => {
      const res = await request(app)
        .get('/api/institution/profile')
        .set('Cookie', officerCookies);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('restricted to authorized institutional representatives');
    });

    it('should forbid institution user from accessing privileged officer route /api/audit', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Cookie', institutionCookies);

      expect(res.status).toBe(403);
    });

    it('should forbid institution user from accessing officer stage transitions', async () => {
      const res = await request(app)
        .patch('/api/applications/app-001/stage')
        .set('Cookie', institutionCookies)
        .set('x-csrf-token', institutionCsrfToken)
        .send({ newStage: 'APPROVAL_GRANTED' });

      expect(res.status).toBe(403);
    });
  });

  describe('3. Application Draft, Checklist, Preliminary Checks & Atomic Submission', () => {
    it('should create an application draft for the authenticated institution', async () => {
      const res = await request(app)
        .post('/api/institution/applications/draft')
        .set('Cookie', institutionCookies)
        .set('x-csrf-token', institutionCsrfToken)
        .send({
          category: 'NEW_INSTITUTE',
          academicCycle: '2026-27',
          requestedIntake: 240,
          landAreaAcres: 7.5,
          draftData: {
            proposedProgrammes: ['Computer Science & Engineering', 'Mechanical Engineering'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isDraft).toBe(true);
      expect(res.body.data.category).toBe('NEW_INSTITUTE');
      expect(res.body.data.institutionId).toBe(institutionId);
      createdDraftId = res.body.data.id;
    });

    it('should retrieve category-specific document checklist', async () => {
      const res = await request(app)
        .get(`/api/institution/applications/${createdDraftId}/checklist`)
        .set('Cookie', institutionCookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((item: any) => item.documentType === 'LAND_LEASE')).toBe(true);
      expect(res.body.data.some((item: any) => item.documentType === 'BUILDING_OCCUPANCY')).toBe(true);
      expect(res.body.data.some((item: any) => item.documentType === 'FIRE_SAFETY_NOC')).toBe(true);
    });

    it('should fail preliminary checks when required documents are missing', async () => {
      const res = await request(app)
        .post(`/api/institution/applications/${createdDraftId}/preliminary-checks`)
        .set('Cookie', institutionCookies)
        .set('x-csrf-token', institutionCsrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.passed).toBe(false);
      expect(res.body.data.errors.length).toBeGreaterThan(0);
      expect(res.body.data.errors.some((e: string) => e.includes('Missing mandatory document'))).toBe(true);
    });

    it('should reject application submission when preliminary checks fail', async () => {
      const res = await request(app)
        .post(`/api/institution/applications/${createdDraftId}/submit`)
        .set('Cookie', institutionCookies)
        .set('x-csrf-token', institutionCsrfToken);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Preliminary checks detected missing mandatory requirements');
    });

    it('should simulate document upload by creating ApplicationDocument records and pass preliminary checks', async () => {
      // Create required documents directly in DB to simulate uploaded files with hash
      const user = await prisma.systemUser.findFirst({ where: { email: testEmail } });
      const requiredDocs: DocumentType[] = ['LAND_LEASE', 'BUILDING_OCCUPANCY', 'FIRE_SAFETY_NOC', 'FDR_ENDOWMENT'];

      for (const docType of requiredDocs) {
        await prisma.applicationDocument.create({
          data: {
            applicationId: createdDraftId,
            institutionId,
            documentType: docType,
            title: `${docType}_Certificate.pdf`,
            fileName: `${docType}_Certificate.pdf`,
            fileSize: 1024 * 500,
            mimeType: 'application/pdf',
            storageKey: `mock_storage_${docType}.pdf`,
            fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            uploadedById: user!.id,
            verificationStatus: 'UPLOADED_PENDING_REVIEW',
          },
        });
      }

      // Re-run preliminary check
      const checkRes = await request(app)
        .post(`/api/institution/applications/${createdDraftId}/preliminary-checks`)
        .set('Cookie', institutionCookies)
        .set('x-csrf-token', institutionCsrfToken);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.passed).toBe(true);
      expect(checkRes.body.data.errors.length).toBe(0);
    });

    it('should atomically submit application to SAKSHAM queue and assign to Scrutiny Officer', async () => {
      const res = await request(app)
        .post(`/api/institution/applications/${createdDraftId}/submit`)
        .set('Cookie', institutionCookies)
        .set('x-csrf-token', institutionCsrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.isDraft).toBe(false);
      expect(res.body.data.application.currentStage).toBe('SUBMITTED');
      expect(res.body.data.application.pendingWithRole).toBe('SCRUTINY_OFFICER');
      expect(res.body.data.application.applicationNumber).toMatch(/^AICTE\/2026\/RO-[A-Z]+\/\d+$/);

      officialAppNumber = res.body.data.application.applicationNumber;
    });

    it('should immediately reflect newly submitted application in Officer Application Register', async () => {
      const res = await request(app)
        .get(`/api/applications?search=${encodeURIComponent(officialAppNumber)}`)
        .set('Cookie', officerCookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      const found = res.body.data.find((a: any) => a.applicationNumber === officialAppNumber);
      expect(found).toBeDefined();
      expect(found.isDraft).toBe(false);
      expect(found.instituteName).toContain('Apex Institute');
    });
  });

  describe('4. Deficiency Notice Two-Way Workflow & Clarification Response', () => {
    let noticeId: string;

    it('should allow Scrutiny Officer to draft an internal deficiency notice', async () => {
      const res = await request(app)
        .post(`/api/applications/${createdDraftId}/deficiencies`)
        .set('Cookie', officerCookies)
        .set('x-csrf-token', officerCsrfToken)
        .send({
          parameterName: 'Land Title Clearance',
          requirementRef: 'APH 2024-27 Clause 1.4',
          title: 'Registered Lease Duration Discrepancy',
          description: 'The uploaded lease document indicates 25 years. AICTE requires a minimum 30-year registered lease.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isReleased).toBe(false);
      noticeId = res.body.data.id;
    });

    it('should ensure draft deficiency notices remain invisible to the institution', async () => {
      const res = await request(app)
        .get('/api/institution/deficiencies')
        .set('Cookie', institutionCookies);

      expect(res.status).toBe(200);
      expect(res.body.data.some((n: any) => n.id === noticeId)).toBe(false);
    });

    it('should allow Scrutiny Officer to formally release deficiency notice to institution', async () => {
      const res = await request(app)
        .post(`/api/applications/${createdDraftId}/deficiencies/${noticeId}/release`)
        .set('Cookie', officerCookies)
        .set('x-csrf-token', officerCsrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isReleased).toBe(true);
    });

    it('should now display released deficiency notice in institution portal', async () => {
      const res = await request(app)
        .get('/api/institution/deficiencies')
        .set('Cookie', institutionCookies);

      expect(res.status).toBe(200);
      const notice = res.body.data.find((n: any) => n.id === noticeId);
      expect(notice).toBeDefined();
      expect(notice.title).toBe('Registered Lease Duration Discrepancy');
      expect(notice.isReleased).toBe(true);
    });

    it('should allow institution to submit clarification response with supporting document reference', async () => {
      const res = await request(app)
        .post(`/api/institution/deficiencies/${noticeId}/respond`)
        .set('Cookie', institutionCookies)
        .set('x-csrf-token', institutionCsrfToken)
        .send({
          responseText: 'We have submitted the Supplementary Addendum Deed confirming 35 years registered lease.',
          documentRef: 'LEASE_ADDENDUM_REG_35YR.pdf',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('AWAITING_OFFICER_REVIEW');
      expect(res.body.data.institutionResponse).toContain('Supplementary Addendum Deed');
    });

    it('should allow officer to review response and mark finding resolved', async () => {
      const res = await request(app)
        .post(`/api/applications/${createdDraftId}/deficiencies/${noticeId}/review`)
        .set('Cookie', officerCookies)
        .set('x-csrf-token', officerCsrfToken)
        .send({
          status: 'RESOLVED_SATISFIED',
          reviewNotes: 'Verified supplementary deed against Sub-Registrar seal. Satisfies Clause 1.4.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED_SATISFIED');
    });
  });
});
