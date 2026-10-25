import { prisma } from '../db/prisma';
import { DocumentType, ValidityStatus, ApplicationCategory, Prisma } from '@prisma/client';

export interface DocumentFilterParams {
  validityStatus?: string;
  documentType?: string;
}

export const getDocumentValidityItemsFromDb = async (filters: DocumentFilterParams) => {
  const where: Prisma.DocumentValidityRecordWhereInput = {};

  if (filters.validityStatus && Object.values(ValidityStatus).includes(filters.validityStatus as ValidityStatus)) {
    where.validityStatus = filters.validityStatus as ValidityStatus;
  }

  if (filters.documentType && Object.values(DocumentType).includes(filters.documentType as DocumentType)) {
    where.documentType = filters.documentType as DocumentType;
  }

  const items = await prisma.documentValidityRecord.findMany({
    where,
    orderBy: [
      { daysToExpiry: 'asc' },
    ],
  });

  return {
    total: items.length,
    data: items.map((d) => ({
      id: d.id,
      applicationId: d.applicationId,
      instituteName: d.instituteName || '',
      documentType: d.documentType,
      documentIdentifier: d.documentIdentifier,
      issuingAuthority: d.issuingAuthority,
      issueDate: d.issueDate.toISOString(),
      expiryDate: d.expiryDate.toISOString(),
      daysToExpiry: d.daysToExpiry,
      validityStatus: d.validityStatus,
      requiredForCategory: d.requiredForCategory as ApplicationCategory[],
      alertLevel: d.alertLevel as 'GREEN' | 'AMBER' | 'ORANGE' | 'RED',
      lastVerificationDate: d.lastVerificationDate.toISOString(),
    })),
  };
};
