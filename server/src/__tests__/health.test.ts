import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('SAKSHAM API Health & Core Endpoints', () => {
  const app = createApp();
  let authCookie: string;
  const demoPassword = process.env.DEMO_USER_PASSWORD || 'AicteDev@2026!';

  beforeAll(async () => {
    // Authenticate as Member Secretary
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ usernameOrEmail: 'rajendra.prasad', password: demoPassword });

    const cookies = loginRes.headers['set-cookie'];
    if (cookies) {
      const list = Array.isArray(cookies) ? cookies : [cookies];
      const cookie = list.find((c: string) => c.startsWith('saksham_token='));
      if (cookie) {
        authCookie = cookie;
      }
    }
  });

  it('GET /api/health should return UP status and uptime without authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('SAKSHAM-API');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('GET /api/health/ready should return READY with storage status without authentication', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
    expect(res.body.checks.apiServer).toBe('UP');
    expect(res.body.checks.regulatoryEngine).toBe('READY');
  });

  it('GET /api/metrics should reject anonymous requests with 401', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/metrics should return calculated dashboard metrics for authenticated officers', async () => {
    const res = await request(app)
      .get('/api/metrics')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalApplications).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty('stageDistribution');
    expect(res.body.data).toHaveProperty('pendingScrutinyCount');
  });

  it('GET /api/applications should reject anonymous requests with 401', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/applications should return filtered application list for authenticated officers', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(res.body.data.length);
  });

  it('GET /api/unknown-route should return 404 with structured error', async () => {
    const res = await request(app).get('/api/unknown-endpoint-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('message');
  });
});
