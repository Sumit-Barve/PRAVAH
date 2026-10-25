import { prisma } from '../db/prisma';
import { ComplianceStatus, Region, Prisma } from '@prisma/client';

export interface ComplianceFilterParams {
  status?: string;
  overdueOnly?: boolean;
}

export const getComplianceItemsFromDb = async (filters: ComplianceFilterParams) => {
  const where: Prisma.ComplianceItemWhereInput = {};

  if (filters.status && Object.values(ComplianceStatus).includes(filters.status as ComplianceStatus)) {
    where.status = filters.status as ComplianceStatus;
  }

  if (filters.overdueOnly) {
    where.OR = [
      { isOverdue: true },
      { daysRemaining: { lt: 0 } },
      { status: 'OVERDUE_ESCALATED' },
    ];
  }

  const items = await prisma.complianceItem.findMany({
    where,
    orderBy: [
      { isOverdue: 'desc' },
      { daysRemaining: 'asc' },
    ],
  });

  return {
    total: items.length,
    data: items.map((c) => ({
      id: c.id,
      applicationId: c.applicationId,
      applicationNumber: c.applicationNumber || '',
      instituteName: c.instituteName || '',
      region: (c.region || 'NORTHERN') as Region,
      undertakingType: c.undertakingType,
      description: c.description,
      grantedDate: c.grantedDate.toISOString(),
      dueDate: c.dueDate.toISOString(),
      daysRemaining: c.daysRemaining,
      status: c.status,
      isOverdue: c.isOverdue,
      submittedDocumentRef: c.submittedDocumentRef || undefined,
      lastReminderSentDate: c.lastReminderSentDate ? c.lastReminderSentDate.toISOString() : undefined,
      escalationLevel: c.escalationLevel as 'NONE' | 'LEVEL_1_WARNING' | 'LEVEL_2_SHOW_CAUSE' | 'LEVEL_3_HEARING',
    })),
  };
};
