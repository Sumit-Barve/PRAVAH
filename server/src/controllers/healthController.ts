import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../db/prisma';

export const getHealth = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'SAKSHAM-API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '2.0.0-phase2-db-integrated',
  });
};

export const getReadiness = async (_req: Request, res: Response) => {
  const isDbConnected = await checkDatabaseConnection();

  if (!isDbConnected) {
    return res.status(503).json({
      status: 'NOT_READY',
      service: 'SAKSHAM-API',
      timestamp: new Date().toISOString(),
      checks: {
        apiServer: 'UP',
        database: 'DISCONNECTED_OR_UNAVAILABLE',
        storageAdapter: 'POSTGRESQL_PRISMA_ACTIVE',
        regulatoryEngine: 'DEGRADED',
      },
      error: {
        message: 'PostgreSQL database connectivity check failed. Service cannot fulfill database-backed queries.',
      },
    });
  }

  return res.status(200).json({
    status: 'READY',
    service: 'SAKSHAM-API',
    timestamp: new Date().toISOString(),
    checks: {
      apiServer: 'UP',
      database: 'CONNECTED_READY',
      storageAdapter: 'POSTGRESQL_PRISMA_ACTIVE',
      regulatoryEngine: 'READY',
    },
  });
};
