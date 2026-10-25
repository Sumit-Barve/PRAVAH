-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('SUBMITTED', 'SCRUTINY', 'RE_SCRUTINY', 'EVC_SCHEDULED', 'EVC_COMPLETED', 'SHC_HEARING', 'SAC_APPEAL', 'APPROVED_CONDITIONAL', 'APPROVAL_GRANTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApplicationCategory" AS ENUM ('NEW_INSTITUTE', 'EOA_EXISTING', 'INTAKE_INCREASE', 'SUPERNUMERARY_SEATS', 'CHANGE_OF_SITE', 'WOMEN_TO_COED', 'CLOSURE');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('NORTHERN', 'NORTH_WEST', 'WESTERN', 'CENTRAL', 'SOUTH_WEST', 'SOUTHERN', 'EASTERN', 'SOUTH_CENTRAL');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('PRIVATE_SELF_FINANCED', 'GOVERNMENT', 'GOVT_AIDED', 'DEEMED_UNIVERSITY', 'STATE_UNIVERSITY');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL_OVERDUE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SCRUTINY_OFFICER', 'REGIONAL_OFFICER', 'EVC_EXPERT', 'SAC_SHC_MEMBER', 'MEMBER_SECRETARY', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "EVCStatus" AS ENUM ('PENDING_CONSTITUTION', 'CONSTITUTED', 'SCHEDULED', 'VISIT_COMPLETED', 'REPORT_SUBMITTED', 'REPORT_OVERDUE');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('ACTIVE_PENDING', 'UNDER_REVIEW', 'VERIFIED_SATISFACTORY', 'OVERDUE_ESCALATED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LAND_LEASE', 'FIRE_SAFETY_NOC', 'BUILDING_OCCUPANCY', 'NBA_ACCREDITATION', 'FDR_ENDOWMENT');

-- CreateEnum
CREATE TYPE "ValidityStatus" AS ENUM ('VALID', 'EXPIRING_SOON', 'CRITICAL_WARNING', 'EXPIRED');

-- CreateTable
CREATE TABLE "SystemUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "region" "Region",
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "permanentInstituteId" TEXT NOT NULL,
    "instituteName" TEXT NOT NULL,
    "trustName" TEXT NOT NULL,
    "category" "ApplicationCategory" NOT NULL,
    "institutionType" "InstitutionType" NOT NULL,
    "region" "Region" NOT NULL,
    "state" TEXT NOT NULL,
    "currentStage" "ApplicationStage" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "PriorityLevel" NOT NULL DEFAULT 'NORMAL',
    "totalAgeingDays" INTEGER NOT NULL DEFAULT 0,
    "stageAgeingDays" INTEGER NOT NULL DEFAULT 0,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedOfficerId" TEXT,
    "assignedOfficer" TEXT,
    "pendingWithRole" "UserRole" NOT NULL DEFAULT 'SCRUTINY_OFFICER',
    "isDeficient" BOOLEAN NOT NULL DEFAULT false,
    "deficiencyCount" INTEGER NOT NULL DEFAULT 0,
    "evcScheduledDate" TIMESTAMP(3),
    "landAreaAcres" DOUBLE PRECISION NOT NULL,
    "approvedIntake" INTEGER NOT NULL,
    "requestedIntake" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrutinyFinding" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "parameterName" TEXT NOT NULL,
    "requirementRef" TEXT NOT NULL,
    "isCompliant" BOOLEAN NOT NULL,
    "observation" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrutinyFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EVCInspection" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "applicationNumber" TEXT,
    "instituteName" TEXT,
    "region" "Region",
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "actualVisitDate" TIMESTAMP(3),
    "status" "EVCStatus" NOT NULL DEFAULT 'PENDING_CONSTITUTION',
    "convenerName" TEXT NOT NULL,
    "convenerAffiliation" TEXT NOT NULL,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "delayHours" INTEGER NOT NULL DEFAULT 0,
    "reportUploadedDate" TIMESTAMP(3),
    "recommendationOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EVCInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EVCExpertMember" (
    "id" TEXT NOT NULL,
    "evcId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,

    CONSTRAINT "EVCExpertMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceItem" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "applicationNumber" TEXT,
    "instituteName" TEXT,
    "region" "Region",
    "undertakingType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "grantedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "daysRemaining" INTEGER NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'ACTIVE_PENDING',
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "submittedDocumentRef" TEXT,
    "lastReminderSentDate" TIMESTAMP(3),
    "escalationLevel" TEXT NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentValidityRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "instituteName" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "documentIdentifier" TEXT NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "daysToExpiry" INTEGER NOT NULL,
    "validityStatus" "ValidityStatus" NOT NULL DEFAULT 'VALID',
    "alertLevel" TEXT NOT NULL DEFAULT 'GREEN',
    "requiredForCategory" "ApplicationCategory"[] DEFAULT ARRAY[]::"ApplicationCategory"[],
    "lastVerificationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentValidityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryRule" (
    "id" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "applicationCategory" "ApplicationCategory" NOT NULL,
    "requirementTitle" TEXT NOT NULL,
    "responsibleRole" "UserRole" NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "chapterSectionPage" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,
    "effectivePeriod" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "slaDays" INTEGER NOT NULL,
    "escalationIntervalDays" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "actionCode" TEXT NOT NULL,
    "actionTitle" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddressMasked" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_username_key" ON "SystemUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_email_key" ON "SystemUser"("email");

-- CreateIndex
CREATE INDEX "SystemUser_role_idx" ON "SystemUser"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNumber_key" ON "Application"("applicationNumber");

-- CreateIndex
CREATE INDEX "Application_currentStage_region_idx" ON "Application"("currentStage", "region");

-- CreateIndex
CREATE INDEX "Application_submissionDate_idx" ON "Application"("submissionDate");

-- CreateIndex
CREATE INDEX "Application_priority_idx" ON "Application"("priority");

-- CreateIndex
CREATE INDEX "Application_category_idx" ON "Application"("category");

-- CreateIndex
CREATE INDEX "ScrutinyFinding_applicationId_idx" ON "ScrutinyFinding"("applicationId");

-- CreateIndex
CREATE INDEX "EVCInspection_applicationId_idx" ON "EVCInspection"("applicationId");

-- CreateIndex
CREATE INDEX "EVCInspection_status_idx" ON "EVCInspection"("status");

-- CreateIndex
CREATE INDEX "EVCInspection_region_idx" ON "EVCInspection"("region");

-- CreateIndex
CREATE INDEX "EVCExpertMember_evcId_idx" ON "EVCExpertMember"("evcId");

-- CreateIndex
CREATE INDEX "ComplianceItem_applicationId_idx" ON "ComplianceItem"("applicationId");

-- CreateIndex
CREATE INDEX "ComplianceItem_status_dueDate_idx" ON "ComplianceItem"("status", "dueDate");

-- CreateIndex
CREATE INDEX "DocumentValidityRecord_applicationId_idx" ON "DocumentValidityRecord"("applicationId");

-- CreateIndex
CREATE INDEX "DocumentValidityRecord_validityStatus_expiryDate_idx" ON "DocumentValidityRecord"("validityStatus", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryRule_ruleCode_key" ON "RegulatoryRule"("ruleCode");

-- CreateIndex
CREATE INDEX "RegulatoryRule_applicationCategory_verificationStatus_idx" ON "RegulatoryRule"("applicationCategory", "verificationStatus");

-- CreateIndex
CREATE INDEX "AuditLogEntry_entityType_entityId_idx" ON "AuditLogEntry"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_actorRole_idx" ON "AuditLogEntry"("actorRole");

-- CreateIndex
CREATE INDEX "AuditLogEntry_timestamp_idx" ON "AuditLogEntry"("timestamp");

-- AddForeignKey
ALTER TABLE "ScrutinyFinding" ADD CONSTRAINT "ScrutinyFinding_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EVCInspection" ADD CONSTRAINT "EVCInspection_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EVCExpertMember" ADD CONSTRAINT "EVCExpertMember_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceItem" ADD CONSTRAINT "ComplianceItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentValidityRecord" ADD CONSTRAINT "DocumentValidityRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
