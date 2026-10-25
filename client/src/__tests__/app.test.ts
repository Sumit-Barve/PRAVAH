import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateDashboardMetrics, MOCK_APPLICATIONS } from '@saksham/shared';
import { apiGet, ApiError } from '../services/apiClient';
import { fetchApplications, fetchApplicationById } from '../services/applicationService';
import { fetchDashboardMetrics } from '../services/metricsService';

describe('SAKSHAM Frontend Metrics & Integrity', () => {
  it('correctly calculates total application count from mock dataset', () => {
    const metrics = calculateDashboardMetrics();
    expect(metrics.totalApplications).toBe(MOCK_APPLICATIONS.length);
  });

  it('ensures stage distribution matches total application count', () => {
    const metrics = calculateDashboardMetrics();
    const sumStages = Object.values(metrics.stageDistribution).reduce((a, b) => a + b, 0);
    expect(sumStages).toBe(metrics.totalApplications);
  });

  it('verifies pending scrutiny count includes both Scrutiny and Re-Scrutiny', () => {
    const metrics = calculateDashboardMetrics();
    const expected =
      metrics.stageDistribution.SCRUTINY + metrics.stageDistribution.RE_SCRUTINY;
    expect(metrics.pendingScrutinyCount).toBe(expected);
  });
});

describe('SAKSHAM API Client & Absence of Silent Fallback', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws ApiError on HTTP 500 without silently returning synthetic mock records', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({
        error: { message: 'Database connection failed: PostgreSQL pool connection timeout' },
      }),
    });

    await expect(fetchApplications()).rejects.toThrow(
      'Database connection failed: PostgreSQL pool connection timeout'
    );
  });

  it('throws ApiError with status 404 for unknown application ID', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({
        error: { message: 'Application with ID NON_EXISTENT not found.' },
      }),
    });

    await expect(fetchApplicationById('NON_EXISTENT')).rejects.toThrow(
      'Application with ID NON_EXISTENT not found.'
    );
  });

  it('correctly parses successful API response data from PostgreSQL endpoints', async () => {
    const mockDbMetrics = {
      totalApplications: 12,
      stageDistribution: {
        SUBMITTED: 1,
        SCRUTINY: 3,
        RE_SCRUTINY: 1,
        EVC_SCHEDULED: 1,
        EVC_COMPLETED: 1,
        SHC_HEARING: 1,
        SAC_APPEAL: 1,
        APPROVED_CONDITIONAL: 1,
        APPROVAL_GRANTED: 1,
        REJECTED: 1,
      },
      categoryDistribution: {
        NEW_INSTITUTE: 4,
        EOA_EXISTING: 4,
        INTAKE_INCREASE: 1,
        SUPERNUMERARY_SEATS: 1,
        CHANGE_OF_SITE: 1,
        WOMEN_TO_COED: 1,
        CLOSURE: 0,
      },
      pendingScrutinyCount: 4,
      overdueTasksCount: 3,
      evcScheduledCount: 2,
      evcOverdueReportsCount: 1,
      complianceDueSoonCount: 2,
      complianceOverdueCount: 1,
      documentValidityExpiringSoonCount: 1,
      documentValidityExpiredCount: 2,
      averageAgeingDays: 14,
      criticalAlertCount: 6,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockDbMetrics,
      }),
    });

    const metrics = await fetchDashboardMetrics();
    expect(metrics.totalApplications).toBe(12);
    expect(metrics.pendingScrutinyCount).toBe(4);
    expect(metrics.averageAgeingDays).toBe(14);
  });

  it('constructs query strings accurately for multi-parameter filtering', async () => {
    let capturedUrl = '';
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          total: 0,
          data: [],
        }),
      });
    });

    await fetchApplications({
      stage: 'SCRUTINY',
      region: 'NORTH_WEST',
      search: 'Apex',
      offset: 20,
      limit: 15,
    });

    expect(capturedUrl).toContain('stage=SCRUTINY');
    expect(capturedUrl).toContain('region=NORTH_WEST');
    expect(capturedUrl).toContain('search=Apex');
    expect(capturedUrl).toContain('offset=20');
    expect(capturedUrl).toContain('limit=15');
  });

  it('rejects on network timeout with HTTP 408 code', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const error: any = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    try {
      await apiGet('/test-timeout', undefined, { timeoutMs: 100 });
      expect.fail('Should have thrown timeout error');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(408);
      expect(err.message).toContain('timed out');
    }
  });
});
