import { prisma } from '../db/prisma';
import { ApplicationStage, ApplicationCategory, DashboardMetrics } from '@saksham/shared';

export const getDashboardMetricsFromDb = async (): Promise<DashboardMetrics> => {
  const [
    totalApplications,
    stageGroups,
    categoryGroups,
    pendingScrutinyCount,
    overdueTasksCount,
    evcScheduledCount,
    evcOverdueReportsCount,
    complianceDueSoonCount,
    complianceOverdueCount,
    docExpiringSoonCount,
    docExpiredCount,
    ageingAggregate,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.groupBy({
      by: ['currentStage'],
      _count: { _all: true },
    }),
    prisma.application.groupBy({
      by: ['category'],
      _count: { _all: true },
    }),
    prisma.application.count({
      where: { currentStage: { in: ['SCRUTINY', 'RE_SCRUTINY'] } },
    }),
    prisma.application.count({
      where: { priority: 'CRITICAL_OVERDUE' },
    }),
    prisma.eVCInspection.count({
      where: { status: 'SCHEDULED' },
    }),
    prisma.eVCInspection.count({
      where: { OR: [{ isOverdue: true }, { status: 'REPORT_OVERDUE' }] },
    }),
    prisma.complianceItem.count({
      where: {
        status: 'ACTIVE_PENDING',
        daysRemaining: { gt: 0, lte: 30 },
      },
    }),
    prisma.complianceItem.count({
      where: {
        OR: [{ isOverdue: true }, { daysRemaining: { lt: 0 } }],
      },
    }),
    prisma.documentValidityRecord.count({
      where: {
        validityStatus: { in: ['EXPIRING_SOON', 'CRITICAL_WARNING'] },
      },
    }),
    prisma.documentValidityRecord.count({
      where: { validityStatus: 'EXPIRED' },
    }),
    prisma.application.aggregate({
      _avg: { totalAgeingDays: true },
    }),
  ]);

  const stageDistribution: Record<ApplicationStage, number> = {
    SUBMITTED: 0,
    SCRUTINY: 0,
    RE_SCRUTINY: 0,
    EVC_SCHEDULED: 0,
    EVC_COMPLETED: 0,
    SHC_HEARING: 0,
    SAC_APPEAL: 0,
    APPROVED_CONDITIONAL: 0,
    APPROVAL_GRANTED: 0,
    REJECTED: 0,
  };

  for (const group of stageGroups) {
    if (group.currentStage in stageDistribution) {
      stageDistribution[group.currentStage as ApplicationStage] = group._count._all;
    }
  }

  const categoryDistribution: Record<ApplicationCategory, number> = {
    NEW_INSTITUTE: 0,
    EOA_EXISTING: 0,
    INTAKE_INCREASE: 0,
    SUPERNUMERARY_SEATS: 0,
    CHANGE_OF_SITE: 0,
    WOMEN_TO_COED: 0,
    CLOSURE: 0,
  };

  for (const group of categoryGroups) {
    if (group.category in categoryDistribution) {
      categoryDistribution[group.category as ApplicationCategory] = group._count._all;
    }
  }

  const averageAgeingDays = ageingAggregate._avg.totalAgeingDays
    ? Math.round(ageingAggregate._avg.totalAgeingDays * 10) / 10
    : 0;

  const criticalAlertCount =
    overdueTasksCount + evcOverdueReportsCount + complianceOverdueCount + docExpiredCount;

  return {
    totalApplications,
    stageDistribution,
    categoryDistribution,
    pendingScrutinyCount,
    overdueTasksCount,
    evcScheduledCount,
    evcOverdueReportsCount,
    complianceDueSoonCount,
    complianceOverdueCount,
    documentValidityExpiringSoonCount: docExpiringSoonCount,
    documentValidityExpiredCount: docExpiredCount,
    averageAgeingDays,
    criticalAlertCount,
  };
};
