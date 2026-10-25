import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { getApplicationsFromDb, getApplicationByIdFromDb } from '../services/applicationService';
import { getDashboardMetricsFromDb } from '../services/metricsService';
import { getRegulatoryRulesFromDb } from '../services/rulesService';
import { getEVCInspectionsFromDb } from '../services/evcService';
import { getComplianceItemsFromDb } from '../services/complianceService';
import { getDocumentValidityItemsFromDb } from '../services/documentService';
import { getAuditLogsFromDb } from '../services/auditService';

describe('SAKSHAM Database-Backed Services & Query Integration', () => {
  const app = createApp();

  describe('Application Database Services', () => {
    it('should retrieve applications with total count from PostgreSQL', async () => {
      const result = await getApplicationsFromDb({});
      expect(result.total).toBeGreaterThanOrEqual(12);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('applicationNumber');
      expect(result.data[0]).toHaveProperty('instituteName');
    });

    it('should filter applications by stage', async () => {
      const result = await getApplicationsFromDb({ stage: 'SCRUTINY' });
      expect(result.data.every((app) => app.currentStage === 'SCRUTINY')).toBe(true);
    });

    it('should filter applications by region', async () => {
      const result = await getApplicationsFromDb({ region: 'WESTERN' });
      expect(result.data.every((app) => app.region === 'WESTERN')).toBe(true);
    });

    it('should perform text search across instituteName, applicationNumber, and state', async () => {
      const result = await getApplicationsFromDb({ search: 'Sahyadri' });
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.data[0].instituteName).toContain('Sahyadri');
    });

    it('should retrieve single application by ID with relations', async () => {
      const appRecord = await getApplicationByIdFromDb('app-001');
      expect(appRecord).not.toBeNull();
      expect(appRecord?.id).toBe('app-001');
      expect(appRecord?.applicationNumber).toBe('AICTE/2026/RO-NW/10481');
      expect(Array.isArray(appRecord?.scrutinyFindings)).toBe(true);
    });

    it('should return null for non-existent application ID without throwing', async () => {
      const appRecord = await getApplicationByIdFromDb('non-existent-id-99999');
      expect(appRecord).toBeNull();
    });
  });

  describe('Dashboard Metrics Service', () => {
    it('should aggregate metrics from relational tables with accurate distributions', async () => {
      const metrics = await getDashboardMetricsFromDb();
      expect(metrics.totalApplications).toBeGreaterThanOrEqual(12);
      expect(metrics.stageDistribution.SCRUTINY).toBeGreaterThan(0);
      expect(metrics.categoryDistribution.NEW_INSTITUTE).toBeGreaterThan(0);
      expect(typeof metrics.averageAgeingDays).toBe('number');
      expect(metrics.criticalAlertCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Regulatory Rules & Operational Services', () => {
    it('should retrieve active regulatory rules with verification status', async () => {
      const result = await getRegulatoryRulesFromDb({});
      expect(result.total).toBeGreaterThanOrEqual(8);
      const verifiedRules = result.data.filter((r) => r.verificationStatus === 'VERIFIED');
      expect(verifiedRules.length).toBeGreaterThan(0);
    });

    it('should retrieve EVC inspections with nested expert members', async () => {
      const result = await getEVCInspectionsFromDb({});
      expect(result.total).toBeGreaterThanOrEqual(4);
      expect(result.data[0]).toHaveProperty('expertMembers');
      expect(Array.isArray(result.data[0].expertMembers)).toBe(true);
    });

    it('should retrieve compliance undertakings and filter overdue items', async () => {
      const result = await getComplianceItemsFromDb({ overdueOnly: true });
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.every((c) => c.isOverdue || c.daysRemaining < 0 || c.status === 'OVERDUE_ESCALATED')).toBe(true);
    });

    it('should retrieve document validity items with expiry indicators', async () => {
      const result = await getDocumentValidityItemsFromDb({});
      expect(result.total).toBeGreaterThanOrEqual(5);
      expect(result.data[0]).toHaveProperty('validityStatus');
      expect(result.data[0]).toHaveProperty('daysToExpiry');
    });

    it('should retrieve audit log entries ordered by timestamp descending', async () => {
      const result = await getAuditLogsFromDb({});
      expect(result.total).toBeGreaterThanOrEqual(5);
      if (result.data.length >= 2) {
        const time0 = new Date(result.data[0].timestamp).getTime();
        const time1 = new Date(result.data[1].timestamp).getTime();
        expect(time0).toBeGreaterThanOrEqual(time1);
      }
    });
  });

  describe('API Route Error Handling & No Silent Fallback', () => {
    let authCookie: string;
    const demoPassword = process.env.DEMO_USER_PASSWORD || 'AicteDev@2026!';

    it('GET /api/applications/:id without auth should return 401', async () => {
      const res = await request(app).get('/api/applications/invalid-app-id-xyz');
      expect(res.status).toBe(401);
    });

    it('GET /api/applications/:id with unknown ID and valid auth should return 404', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ usernameOrEmail: 'rajendra.prasad', password: demoPassword });
      const cookies = loginRes.headers['set-cookie'];
      const list = Array.isArray(cookies) ? cookies : [cookies || ''];
      authCookie = list.find((c: string) => c.startsWith('saksham_token=')) || '';

      const res = await request(app)
        .get('/api/applications/invalid-app-id-xyz')
        .set('Cookie', [authCookie]);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found in database');
    });

    it('GET /api/rules should return real database records matching query filters', async () => {
      if (!authCookie) {
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({ usernameOrEmail: 'rajendra.prasad', password: demoPassword });
        const cookies = loginRes.headers['set-cookie'];
        const list = Array.isArray(cookies) ? cookies : [cookies || ''];
        authCookie = list.find((c: string) => c.startsWith('saksham_token=')) || '';
      }

      const res = await request(app)
        .get('/api/rules?verificationStatus=VERIFIED')
        .set('Cookie', [authCookie]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((r: any) => r.verificationStatus === 'VERIFIED')).toBe(true);
    });
  });
});
