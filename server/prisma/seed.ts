import { PrismaClient, Region, ApplicationCategory, InstitutionType, ApplicationStage, PriorityLevel, UserRole, EVCStatus, ComplianceStatus, DocumentType, ValidityStatus } from '@prisma/client';
import {
  MOCK_APPLICATIONS,
  MOCK_EVC_INSPECTIONS,
  MOCK_COMPLIANCE_ITEMS,
  MOCK_DOCUMENT_VALIDITY_ITEMS,
  MOCK_REGULATORY_RULES,
  MOCK_AUDIT_LOGS,
} from '@saksham/shared';

import argon2 from 'argon2';

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'AicteDev@2026!';

const PRESET_SYSTEM_USERS = [
  {
    id: 'usr-scr-01',
    username: 'rk.sharma',
    email: 'rk.sharma@aicte.gov.in',
    fullName: 'Dr. R. K. Sharma',
    role: UserRole.SCRUTINY_OFFICER,
    region: Region.NORTH_WEST,
    department: 'Scrutiny Committee Desk',
  },
  {
    id: 'usr-scr-02',
    username: 'anjali.deshmukh',
    email: 'anjali.deshmukh@aicte.gov.in',
    fullName: 'Prof. Anjali Deshmukh',
    role: UserRole.SCRUTINY_OFFICER,
    region: Region.WESTERN,
    department: 'Western Scrutiny Cell',
  },
  {
    id: 'usr-scr-03',
    username: 's.narayanan',
    email: 's.narayanan@aicte.gov.in',
    fullName: 'Er. S. Narayanan',
    role: UserRole.SCRUTINY_OFFICER,
    region: Region.SOUTHERN,
    department: 'Re-Scrutiny Operations',
  },
  {
    id: 'usr-ro-01',
    username: 'neelesh.verma',
    email: 'ro.central@aicte.gov.in',
    fullName: 'Dr. Neelesh Verma',
    role: UserRole.REGIONAL_OFFICER,
    region: Region.CENTRAL,
    department: 'Central Regional Office (CRO)',
  },
  {
    id: 'usr-evc-01',
    username: 'cm.rao',
    email: 'cm.rao.evc@aicte.gov.in',
    fullName: 'Prof. C. M. Rao',
    role: UserRole.EVC_EXPERT,
    region: Region.SOUTH_WEST,
    department: 'Expert Visit Committee Panel',
  },
  {
    id: 'usr-sac-01',
    username: 'bn.panda',
    email: 'sac.hearing@aicte.gov.in',
    fullName: 'Justice (Retd.) B. N. Panda',
    role: UserRole.SAC_SHC_MEMBER,
    region: Region.NORTHERN,
    department: 'Standing Appellate Committee (SAC)',
  },
  {
    id: 'usr-ms-01',
    username: 'rajendra.prasad',
    email: 'member.secretary@aicte.gov.in',
    fullName: 'Prof. Rajendra Prasad',
    role: UserRole.MEMBER_SECRETARY,
    region: Region.NORTHERN,
    department: 'Council Headquarters / Approval Bureau',
  },
  {
    id: 'usr-adm-01',
    username: 'itadmin.saksham',
    email: 'itadmin.saksham@aicte.gov.in',
    fullName: 'Administrative IT Cell',
    role: UserRole.SYSTEM_ADMIN,
    region: Region.NORTHERN,
    department: 'AICTE e-Governance Division',
  },
];

async function main() {
  console.log('--- Starting SAKSHAM Idempotent Database Seed ---');

  // 1. Seed System Users with Argon2id Password Hashes
  console.log('Seeding System Users with Argon2id password hashes...');
  const defaultHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  for (const user of PRESET_SYSTEM_USERS) {
    const existing = await prisma.systemUser.findUnique({ where: { id: user.id } });
    await prisma.systemUser.upsert({
      where: { id: user.id },
      update: {
        fullName: user.fullName,
        role: user.role,
        region: user.region,
        department: user.department,
        passwordHash: existing?.passwordHash && existing.passwordHash.length > 0 ? existing.passwordHash : defaultHash,
      },
      create: {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: defaultHash,
        fullName: user.fullName,
        role: user.role,
        region: user.region,
        department: user.department,
        isActive: true,
      },
    });
  }

  // 2. Seed Institutions
  console.log('Seeding Institutions...');
  const institutionMap = new Map<string, string>(); // PID -> Institution ID

  for (const app of MOCK_APPLICATIONS) {
    if (!institutionMap.has(app.permanentInstituteId)) {
      const instEmail = `contact.${app.permanentInstituteId.replace('-', '')}@aicte-institutes.edu.in`;
      const inst = await prisma.institution.upsert({
        where: { permanentInstituteId: app.permanentInstituteId },
        update: {
          name: app.instituteName,
          trustName: app.trustName,
          institutionType: app.institutionType as InstitutionType,
          region: app.region as Region,
          state: app.state,
          isVerified: true,
        },
        create: {
          permanentInstituteId: app.permanentInstituteId,
          name: app.instituteName,
          trustName: app.trustName,
          institutionType: app.institutionType as InstitutionType,
          region: app.region as Region,
          state: app.state,
          contactEmail: app.permanentInstituteId === '1-3489128' ? 'director@apextech.ac.in' : instEmail,
          contactPhone: '+91-9876543210',
          isVerified: true,
        },
      });
      institutionMap.set(app.permanentInstituteId, inst.id);
    }
  }

  // 3. Seed Demo Institution Users
  console.log('Seeding Demo Institution Users...');
  const apexInst = await prisma.institution.upsert({
    where: { permanentInstituteId: '1-3489128' },
    update: {},
    create: {
      permanentInstituteId: '1-3489128',
      name: 'Apex Institute of Technology & Management',
      trustName: 'Apex Educational & Research Foundation',
      institutionType: InstitutionType.ENGINEERING_TECH,
      region: Region.NORTH_WEST,
      state: 'Punjab',
      contactEmail: 'director@apextech.ac.in',
      contactPhone: '+91-9876543210',
      isVerified: true,
    },
  });
  const apexInstId = apexInst.id;
  if (apexInstId) {
    await prisma.systemUser.upsert({
      where: { email: 'director@apextech.ac.in' },
      update: {
        institutionId: apexInstId,
        passwordHash: defaultHash,
        isEmailVerified: true,
      },
      create: {
        id: 'usr-inst-apex',
        username: 'director.apex',
        email: 'director@apextech.ac.in',
        fullName: 'Dr. Vikram Malhotra',
        role: UserRole.INSTITUTION_USER,
        institutionId: apexInstId,
        department: 'Principal / Authorized Representative',
        passwordHash: defaultHash,
        isActive: true,
        isEmailVerified: true,
      },
    });
  }

  const sahyadriInst = await prisma.institution.upsert({
    where: { permanentInstituteId: '1-8491029' },
    update: {},
    create: {
      permanentInstituteId: '1-8491029',
      name: 'Sahyadri Institute of Engineering & Research',
      trustName: 'Western Education Trust',
      institutionType: InstitutionType.ENGINEERING_TECH,
      region: Region.WESTERN,
      state: 'Maharashtra',
      contactEmail: 'principal@sahyadri.ac.in',
      contactPhone: '+91-9811122233',
      isVerified: true,
    },
  });
  const sahyadriInstId = sahyadriInst.id;
  if (sahyadriInstId) {
    await prisma.systemUser.upsert({
      where: { email: 'principal@sahyadri.ac.in' },
      update: {
        institutionId: sahyadriInstId,
        passwordHash: defaultHash,
        isEmailVerified: true,
      },
      create: {
        id: 'usr-inst-sahyadri',
        username: 'principal.sahyadri',
        email: 'principal@sahyadri.ac.in',
        fullName: 'Dr. Ramesh Joshi',
        role: UserRole.INSTITUTION_USER,
        institutionId: sahyadriInstId,
        department: 'Director / Authorized Signatory',
        passwordHash: defaultHash,
        isActive: true,
        isEmailVerified: true,
      },
    });
  }

  // 4. Seed Applications (Linked to Institutions)
  console.log('Seeding Applications with Institution links...');
  for (const app of MOCK_APPLICATIONS) {
    const instId = institutionMap.get(app.permanentInstituteId);
    await prisma.application.upsert({
      where: { id: app.id },
      update: {
        applicationNumber: app.applicationNumber,
        permanentInstituteId: app.permanentInstituteId,
        instituteName: app.instituteName,
        trustName: app.trustName,
        category: app.category as ApplicationCategory,
        institutionType: app.institutionType as InstitutionType,
        region: app.region as Region,
        state: app.state,
        currentStage: app.currentStage as ApplicationStage,
        priority: app.priority as PriorityLevel,
        totalAgeingDays: app.totalAgeingDays,
        stageAgeingDays: app.stageAgeingDays,
        submissionDate: new Date(app.submissionDate),
        assignedOfficer: app.assignedOfficer,
        pendingWithRole: app.pendingWithRole as UserRole,
        isDeficient: app.isDeficient,
        deficiencyCount: app.deficiencyCount,
        evcScheduledDate: app.evcScheduledDate ? new Date(app.evcScheduledDate) : null,
        landAreaAcres: app.landAreaAcres,
        approvedIntake: app.approvedIntake,
        requestedIntake: app.requestedIntake,
        lastUpdated: new Date(app.lastUpdated),
        institutionId: instId,
        isDraft: false,
      },
      create: {
        id: app.id,
        applicationNumber: app.applicationNumber,
        permanentInstituteId: app.permanentInstituteId,
        instituteName: app.instituteName,
        trustName: app.trustName,
        category: app.category as ApplicationCategory,
        institutionType: app.institutionType as InstitutionType,
        region: app.region as Region,
        state: app.state,
        currentStage: app.currentStage as ApplicationStage,
        priority: app.priority as PriorityLevel,
        totalAgeingDays: app.totalAgeingDays,
        stageAgeingDays: app.stageAgeingDays,
        submissionDate: new Date(app.submissionDate),
        assignedOfficer: app.assignedOfficer,
        pendingWithRole: app.pendingWithRole as UserRole,
        isDeficient: app.isDeficient,
        deficiencyCount: app.deficiencyCount,
        evcScheduledDate: app.evcScheduledDate ? new Date(app.evcScheduledDate) : null,
        landAreaAcres: app.landAreaAcres,
        approvedIntake: app.approvedIntake,
        requestedIntake: app.requestedIntake,
        lastUpdated: new Date(app.lastUpdated),
        institutionId: instId,
        isDraft: false,
      },
    });
  }

  // 3. Seed EVC Inspections and Expert Members
  console.log('Seeding EVC Inspections...');
  for (const evc of MOCK_EVC_INSPECTIONS) {
    const inspection = await prisma.eVCInspection.upsert({
      where: { id: evc.id },
      update: {
        applicationId: evc.applicationId,
        applicationNumber: evc.applicationNumber,
        instituteName: evc.instituteName,
        region: evc.region as Region,
        proposedDate: new Date(evc.proposedDate),
        actualVisitDate: evc.actualVisitDate ? new Date(evc.actualVisitDate) : null,
        status: evc.status as EVCStatus,
        convenerName: evc.convenerName,
        convenerAffiliation: evc.convenerAffiliation,
        isOverdue: evc.isOverdue,
        delayHours: evc.delayHours,
        reportUploadedDate: evc.reportUploadedDate ? new Date(evc.reportUploadedDate) : null,
        recommendationOutcome: evc.recommendationOutcome || null,
      },
      create: {
        id: evc.id,
        applicationId: evc.applicationId,
        applicationNumber: evc.applicationNumber,
        instituteName: evc.instituteName,
        region: evc.region as Region,
        proposedDate: new Date(evc.proposedDate),
        actualVisitDate: evc.actualVisitDate ? new Date(evc.actualVisitDate) : null,
        status: evc.status as EVCStatus,
        convenerName: evc.convenerName,
        convenerAffiliation: evc.convenerAffiliation,
        isOverdue: evc.isOverdue,
        delayHours: evc.delayHours,
        reportUploadedDate: evc.reportUploadedDate ? new Date(evc.reportUploadedDate) : null,
        recommendationOutcome: evc.recommendationOutcome || null,
      },
    });

    // Delete existing members for this inspection and re-insert to maintain idempotency
    await prisma.eVCExpertMember.deleteMany({
      where: { evcId: inspection.id },
    });

    for (const member of evc.expertMembers) {
      await prisma.eVCExpertMember.create({
        data: {
          evcId: inspection.id,
          name: member.name,
          designation: member.designation,
          specialization: member.specialization,
        },
      });
    }
  }

  // 4. Seed Compliance Items
  console.log('Seeding Compliance Items...');
  for (const comp of MOCK_COMPLIANCE_ITEMS) {
    await prisma.complianceItem.upsert({
      where: { id: comp.id },
      update: {
        applicationId: comp.applicationId,
        applicationNumber: comp.applicationNumber,
        instituteName: comp.instituteName,
        region: comp.region as Region,
        undertakingType: comp.undertakingType,
        description: comp.description,
        grantedDate: new Date(comp.grantedDate),
        dueDate: new Date(comp.dueDate),
        daysRemaining: comp.daysRemaining,
        status: comp.status as ComplianceStatus,
        isOverdue: comp.isOverdue,
        submittedDocumentRef: comp.submittedDocumentRef || null,
        lastReminderSentDate: comp.lastReminderSentDate ? new Date(comp.lastReminderSentDate) : null,
        escalationLevel: comp.escalationLevel,
      },
      create: {
        id: comp.id,
        applicationId: comp.applicationId,
        applicationNumber: comp.applicationNumber,
        instituteName: comp.instituteName,
        region: comp.region as Region,
        undertakingType: comp.undertakingType,
        description: comp.description,
        grantedDate: new Date(comp.grantedDate),
        dueDate: new Date(comp.dueDate),
        daysRemaining: comp.daysRemaining,
        status: comp.status as ComplianceStatus,
        isOverdue: comp.isOverdue,
        submittedDocumentRef: comp.submittedDocumentRef || null,
        lastReminderSentDate: comp.lastReminderSentDate ? new Date(comp.lastReminderSentDate) : null,
        escalationLevel: comp.escalationLevel,
      },
    });
  }

  // 5. Seed Document Validity Records
  console.log('Seeding Document Validity Records...');
  for (const doc of MOCK_DOCUMENT_VALIDITY_ITEMS) {
    await prisma.documentValidityRecord.upsert({
      where: { id: doc.id },
      update: {
        applicationId: doc.applicationId,
        instituteName: doc.instituteName,
        documentType: doc.documentType as DocumentType,
        documentIdentifier: doc.documentIdentifier,
        issuingAuthority: doc.issuingAuthority,
        issueDate: new Date(doc.issueDate),
        expiryDate: new Date(doc.expiryDate),
        daysToExpiry: doc.daysToExpiry,
        validityStatus: doc.validityStatus as ValidityStatus,
        alertLevel: doc.alertLevel,
        requiredForCategory: doc.requiredForCategory as ApplicationCategory[],
        lastVerificationDate: new Date(doc.lastVerificationDate),
      },
      create: {
        id: doc.id,
        applicationId: doc.applicationId,
        instituteName: doc.instituteName,
        documentType: doc.documentType as DocumentType,
        documentIdentifier: doc.documentIdentifier,
        issuingAuthority: doc.issuingAuthority,
        issueDate: new Date(doc.issueDate),
        expiryDate: new Date(doc.expiryDate),
        daysToExpiry: doc.daysToExpiry,
        validityStatus: doc.validityStatus as ValidityStatus,
        alertLevel: doc.alertLevel,
        requiredForCategory: doc.requiredForCategory as ApplicationCategory[],
        lastVerificationDate: new Date(doc.lastVerificationDate),
      },
    });
  }

  // 6. Seed Regulatory Rules
  console.log('Seeding Regulatory Rules...');
  for (const rule of MOCK_REGULATORY_RULES) {
    await prisma.regulatoryRule.upsert({
      where: { ruleCode: rule.ruleCode },
      update: {
        applicationCategory: rule.applicationCategory as ApplicationCategory,
        requirementTitle: rule.requirementTitle,
        responsibleRole: rule.responsibleRole as UserRole,
        sourceTitle: rule.sourceTitle,
        chapterSectionPage: rule.chapterSectionPage,
        sourceVersion: rule.sourceVersion,
        effectivePeriod: rule.effectivePeriod,
        verificationStatus: rule.verificationStatus,
        slaDays: rule.slaDays,
        escalationIntervalDays: rule.escalationIntervalDays,
        notes: rule.notes,
        isActive: true,
      },
      create: {
        id: rule.id,
        ruleCode: rule.ruleCode,
        applicationCategory: rule.applicationCategory as ApplicationCategory,
        requirementTitle: rule.requirementTitle,
        responsibleRole: rule.responsibleRole as UserRole,
        sourceTitle: rule.sourceTitle,
        chapterSectionPage: rule.chapterSectionPage,
        sourceVersion: rule.sourceVersion,
        effectivePeriod: rule.effectivePeriod,
        verificationStatus: rule.verificationStatus,
        slaDays: rule.slaDays,
        escalationIntervalDays: rule.escalationIntervalDays,
        notes: rule.notes,
        isActive: true,
      },
    });
  }

  // 7. Seed Audit Log Entries
  console.log('Seeding Audit Log Entries...');
  for (const log of MOCK_AUDIT_LOGS) {
    await prisma.auditLogEntry.upsert({
      where: { id: log.id },
      update: {
        timestamp: new Date(log.timestamp),
        actorId: log.actorId,
        actorName: log.actorName,
        actorRole: log.actorRole as UserRole,
        actionCode: log.actionCode,
        actionTitle: log.actionTitle,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddressMasked: log.ipAddressMasked,
        previousState: log.previousState || null,
        newState: log.newState || null,
      },
      create: {
        id: log.id,
        timestamp: new Date(log.timestamp),
        actorId: log.actorId,
        actorName: log.actorName,
        actorRole: log.actorRole as UserRole,
        actionCode: log.actionCode,
        actionTitle: log.actionTitle,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddressMasked: log.ipAddressMasked,
        previousState: log.previousState || null,
        newState: log.newState || null,
      },
    });
  }

  // 8. Seed Scrutiny Findings for Applications app-001 and app-002
  console.log('Seeding Scrutiny Findings...');
  const app1 = await prisma.application.findUnique({ where: { id: 'app-001' } });
  if (app1) {
    await prisma.scrutinyFinding.deleteMany({ where: { applicationId: 'app-001' } });
    await prisma.scrutinyFinding.createMany({
      data: [
        {
          applicationId: 'app-001',
          parameterName: 'Registered Sale Deed / Government Lease (>=30 Years)',
          requirementRef: 'APH Ch. I Sec 1.3(a)',
          isCompliant: true,
          observation: 'Verified registered sale deed. Clear unencumbered title on single plot.',
          verifiedBy: 'Dr. R. K. Sharma',
          verifiedAt: new Date('2026-10-10T11:00:00Z'),
        },
        {
          applicationId: 'app-001',
          parameterName: 'Approved Building Plan with Barrier-Free Ramps & Lift Access',
          requirementRef: 'APH Ch. I Sec 1.3(c) & NBC 2016',
          isCompliant: true,
          observation: 'Municipal approved blueprint verified. Ramps and lift compliant.',
          verifiedBy: 'Dr. R. K. Sharma',
          verifiedAt: new Date('2026-10-10T11:30:00Z'),
        },
        {
          applicationId: 'app-001',
          parameterName: 'Valid Permanent Fire Safety Certificate (Fire NOC)',
          requirementRef: 'APH Ch. I Sec 1.3(f)',
          isCompliant: true,
          observation: 'Fire safety certificate valid through current academic year.',
          verifiedBy: 'Dr. R. K. Sharma',
          verifiedAt: new Date('2026-10-10T12:00:00Z'),
        },
      ],
    });
  }

  const app2 = await prisma.application.findUnique({ where: { id: 'app-002' } });
  if (app2) {
    await prisma.scrutinyFinding.deleteMany({ where: { applicationId: 'app-002' } });
    await prisma.scrutinyFinding.createMany({
      data: [
        {
          applicationId: 'app-002',
          parameterName: 'Faculty Cadre & Student-Teacher Ratio (1:15/1:20)',
          requirementRef: 'APH Ch. II Sec 2.4',
          isCompliant: false,
          observation: 'Shortfall of 3 regular Professors and 4 Associate Professors in Computer Science.',
          verifiedBy: 'Prof. Anjali Deshmukh',
          verifiedAt: new Date('2026-10-22T10:00:00Z'),
        },
        {
          applicationId: 'app-002',
          parameterName: 'Land Lease Renewal (Live Lease >= Course Duration)',
          requirementRef: 'APH Ch. I Sec 1.3(a)',
          isCompliant: false,
          observation: '30-year lease agreement expiring in 52 days; renewal proof required.',
          verifiedBy: 'Prof. Anjali Deshmukh',
          verifiedAt: new Date('2026-10-22T10:30:00Z'),
        },
      ],
    });
  }

  // 8. Seed Sample Deficiency Notices (Two-Way Communication)
  console.log('Seeding Sample Deficiency Notices...');
  const appWro = await prisma.application.findUnique({ where: { id: 'app-wro-01' } });
  if (appWro) {
    await prisma.deficiencyNotice.upsert({
      where: { noticeNumber: 'DEF-2026-WRO-001' },
      update: {
        title: 'Fire Safety NOC Renewal & Cadre Ratio Deficiency',
        description: 'Scrutiny Committee inspection noted that the Municipal Fire Safety NOC expires within 45 days. In addition, the faculty cadre ratio in Computer Engineering is currently 1:22 versus required 1:15.',
        isReleased: true,
        status: 'ISSUED',
      },
      create: {
        id: 'not-def-wro-001',
        applicationId: 'app-wro-01',
        noticeNumber: 'DEF-2026-WRO-001',
        title: 'Fire Safety NOC Renewal & Cadre Ratio Deficiency',
        description: 'Scrutiny Committee inspection noted that the Municipal Fire Safety NOC expires within 45 days. In addition, the faculty cadre ratio in Computer Engineering is currently 1:22 versus required 1:15.',
        parameterName: 'Fire NOC & Faculty Cadre Ratio',
        requirementRef: 'APH 2024-27 Chapter II Clause 2.4',
        issuedById: 'usr-scr-02',
        issuedByName: 'Prof. Anjali Deshmukh',
        issuedRole: UserRole.SCRUTINY_OFFICER,
        isReleased: true,
        releasedAt: new Date('2026-10-22T10:00:00Z'),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        status: 'ISSUED',
      },
    });
  }

  // 9. Seed Sample Notifications for Institutions
  if (apexInstId) {
    await prisma.notification.createMany({
      data: [
        {
          institutionId: apexInstId,
          title: 'Application AICTE/2026/RO-NW/10928 under Scrutiny',
          message: 'Your New Technical Institute application has been assigned to the Scrutiny Desk for preliminary document verification.',
          type: 'INFO',
          link: '/institution/applications/app-nw-01',
          isRead: false,
        },
        {
          institutionId: apexInstId,
          title: 'APH 2026-27 Document Checklist Uploaded',
          message: 'Ensure Land Lease Deed and Building Occupancy certificates conform to APH Chapter I Clause 1.4.',
          type: 'SUCCESS',
          link: '/institution/documents',
          isRead: true,
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log('--- SAKSHAM Idempotent Database Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
