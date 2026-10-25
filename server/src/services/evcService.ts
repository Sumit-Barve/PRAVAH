import { prisma } from '../db/prisma';
import { EVCStatus, Region, Prisma } from '@prisma/client';

export interface EVCFilterParams {
  status?: string;
  region?: string;
}

export const getEVCInspectionsFromDb = async (filters: EVCFilterParams) => {
  const where: Prisma.EVCInspectionWhereInput = {};

  if (filters.status && Object.values(EVCStatus).includes(filters.status as EVCStatus)) {
    where.status = filters.status as EVCStatus;
  }

  if (filters.region && Object.values(Region).includes(filters.region as Region)) {
    where.region = filters.region as Region;
  }

  const inspections = await prisma.eVCInspection.findMany({
    where,
    include: {
      expertMembers: {
        select: {
          name: true,
          designation: true,
          specialization: true,
        },
      },
    },
    orderBy: [
      { isOverdue: 'desc' },
      { proposedDate: 'asc' },
    ],
  });

  return {
    total: inspections.length,
    data: inspections.map((i) => ({
      id: i.id,
      applicationId: i.applicationId,
      applicationNumber: i.applicationNumber || '',
      instituteName: i.instituteName || '',
      region: i.region as Region,
      proposedDate: i.proposedDate.toISOString(),
      actualVisitDate: i.actualVisitDate ? i.actualVisitDate.toISOString() : undefined,
      status: i.status,
      convenerName: i.convenerName,
      convenerAffiliation: i.convenerAffiliation,
      expertMembers: i.expertMembers,
      isOverdue: i.isOverdue,
      delayHours: i.delayHours,
      reportUploadedDate: i.reportUploadedDate ? i.reportUploadedDate.toISOString() : undefined,
      recommendationOutcome: (i.recommendationOutcome as 'SATISFACTORY' | 'DEFICIENCIES_OBSERVED' | 'REJECTED') || undefined,
    })),
  };
};
