import { prisma } from '../db/prisma';
import { UserRole, Prisma } from '@prisma/client';

export interface AuditFilterParams {
  entityType?: string;
  actorRole?: string;
  limit?: number;
}

export const getAuditLogsFromDb = async (filters: AuditFilterParams) => {
  const where: Prisma.AuditLogEntryWhereInput = {};

  if (filters.entityType && typeof filters.entityType === 'string' && filters.entityType !== 'ALL') {
    where.entityType = filters.entityType;
  }

  if (filters.actorRole && Object.values(UserRole).includes(filters.actorRole as UserRole)) {
    where.actorRole = filters.actorRole as UserRole;
  }

  const logs = await prisma.auditLogEntry.findMany({
    where,
    orderBy: [
      { timestamp: 'desc' },
    ],
    take: filters.limit ? Math.min(Math.max(1, filters.limit), 200) : 100,
  });

  return {
    total: logs.length,
    data: logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      actorId: l.actorId,
      actorName: l.actorName,
      actorRole: l.actorRole,
      actionCode: l.actionCode,
      actionTitle: l.actionTitle,
      entityType: l.entityType as 'APPLICATION' | 'EVC' | 'COMPLIANCE' | 'DOCUMENT' | 'RULE',
      entityId: l.entityId,
      details: l.details,
      ipAddressMasked: l.ipAddressMasked,
      previousState: l.previousState || undefined,
      newState: l.newState || undefined,
    })),
  };
};

export interface CreateAuditEntryInput {
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actionCode: string;
  actionTitle: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddressMasked: string;
  previousState?: string;
  newState?: string;
}

export const recordAuditEvent = async (entry: CreateAuditEntryInput) => {
  try {
    return await prisma.auditLogEntry.create({
      data: {
        actorId: entry.actorId,
        actorName: entry.actorName,
        actorRole: entry.actorRole,
        actionCode: entry.actionCode,
        actionTitle: entry.actionTitle,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details,
        ipAddressMasked: entry.ipAddressMasked,
        previousState: entry.previousState,
        newState: entry.newState,
      },
    });
  } catch (error) {
    // Fail-safe: Audit logging should not crash the primary operational request, but should be reported
    console.error('[AUDIT_ERROR] Failed to persist audit log entry:', error);
    return null;
  }
};

