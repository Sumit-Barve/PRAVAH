import { prisma } from '../db/prisma';
import { UserRole } from '@prisma/client';
import { recordAuditEvent } from './auditService';
import { sendDeficiencyNoticeEmail } from './emailService';

export interface DraftNoticeParams {
  applicationId: string;
  parameterName: string;
  requirementRef: string;
  title: string;
  description: string;
  dueDate?: Date;
  officerId: string;
  officerName: string;
  officerRole: UserRole;
}

/**
 * Creates an internal draft deficiency notice on an application.
 */
export const createDraftDeficiencyNotice = async (params: DraftNoticeParams) => {
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  const count = await prisma.deficiencyNotice.count();
  const noticeNumber = `DEF-2026-${1000 + count + 1}`;
  const defaultDueDate = params.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const notice = await prisma.deficiencyNotice.create({
    data: {
      applicationId: application.id,
      noticeNumber,
      title: params.title,
      description: params.description,
      parameterName: params.parameterName,
      requirementRef: params.requirementRef,
      issuedById: params.officerId,
      issuedByName: params.officerName,
      issuedRole: params.officerRole,
      isReleased: false, // Internal draft by default
      dueDate: defaultDueDate,
      status: 'ISSUED_PENDING_RESPONSE',
    },
  });

  await recordAuditEvent({
    actorId: params.officerId,
    actorName: params.officerName,
    actorRole: params.officerRole,
    actionCode: 'DEFICIENCY_NOTICE_DRAFTED',
    actionTitle: 'Internal Deficiency Notice Drafted',
    entityType: 'DEFICIENCY_NOTICE',
    entityId: notice.id,
    details: `Draft notice '${noticeNumber}' drafted for parameter '${params.parameterName}' on application '${application.applicationNumber}'.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return notice;
};

/**
 * Releases a deficiency notice, making it visible to the institution.
 */
export const releaseDeficiencyNotice = async (
  noticeId: string,
  officerId: string,
  officerName: string,
  officerRole: UserRole
) => {
  const notice = await prisma.deficiencyNotice.findUnique({
    where: { id: noticeId },
    include: {
      application: {
        include: { institution: true },
      },
    },
  });

  if (!notice) {
    throw new Error('Deficiency notice not found');
  }

  const releasedNotice = await prisma.deficiencyNotice.update({
    where: { id: noticeId },
    data: {
      isReleased: true,
      releasedAt: new Date(),
    },
  });

  // Mark application as deficient
  await prisma.application.update({
    where: { id: notice.applicationId },
    data: {
      isDeficient: true,
      deficiencyCount: { increment: 1 },
      lastUpdated: new Date(),
    },
  });

  // Create notification for institution
  if (notice.application.institutionId) {
    await prisma.notification.create({
      data: {
        institutionId: notice.application.institutionId,
        title: `Official Deficiency Notice: ${notice.title}`,
        message: `AICTE Scrutiny Committee issued Notice ${notice.noticeNumber}. Clarification and documents required by ${notice.dueDate ? notice.dueDate.toLocaleDateString() : 'stipulated deadline'}.`,
        type: 'WARNING',
        link: `/institution/applications/${notice.applicationId}`,
      },
    });

    if (notice.application.institution?.contactEmail) {
      await sendDeficiencyNoticeEmail(
        notice.application.institution.contactEmail,
        notice.application.instituteName,
        notice.noticeNumber,
        notice.application.applicationNumber
      );
    }
  }

  await recordAuditEvent({
    actorId: officerId,
    actorName: officerName,
    actorRole: officerRole,
    actionCode: 'DEFICIENCY_NOTICE_RELEASED',
    actionTitle: 'Deficiency Notice Released to Institution',
    entityType: 'DEFICIENCY_NOTICE',
    entityId: notice.id,
    details: `Notice '${notice.noticeNumber}' formally released to institution '${notice.application.instituteName}'.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return releasedNotice;
};

/**
 * Reviews the institution's submitted response to a deficiency notice.
 */
export const reviewDeficiencyResponse = async (
  noticeId: string,
  officerId: string,
  officerName: string,
  officerRole: UserRole,
  review: {
    status: 'RESOLVED_SATISFIED' | 'REJECTED_UNSATISFACTORY';
    reviewNotes: string;
  }
) => {
  const notice = await prisma.deficiencyNotice.findUnique({
    where: { id: noticeId },
    include: { application: true },
  });

  if (!notice) {
    throw new Error('Deficiency notice not found');
  }

  const updatedNotice = await prisma.deficiencyNotice.update({
    where: { id: noticeId },
    data: {
      status: review.status,
      officerReviewNotes: review.reviewNotes,
    },
  });

  // If resolved, decrement deficiency count
  if (review.status === 'RESOLVED_SATISFIED' && notice.application.deficiencyCount > 0) {
    const newCount = Math.max(0, notice.application.deficiencyCount - 1);
    await prisma.application.update({
      where: { id: notice.applicationId },
      data: {
        deficiencyCount: newCount,
        isDeficient: newCount > 0,
        lastUpdated: new Date(),
      },
    });
  }

  await recordAuditEvent({
    actorId: officerId,
    actorName: officerName,
    actorRole: officerRole,
    actionCode: 'DEFICIENCY_RESPONSE_REVIEWED',
    actionTitle: 'Deficiency Response Evaluated',
    entityType: 'DEFICIENCY_NOTICE',
    entityId: notice.id,
    details: `Review completed for Notice '${notice.noticeNumber}'. Outcome: ${review.status}.`,
    ipAddressMasked: '127.0.0.xxx',
  });

  return updatedNotice;
};
