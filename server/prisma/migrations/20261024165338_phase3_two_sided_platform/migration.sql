-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'INSTITUTION_USER';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "academicCycle" TEXT NOT NULL DEFAULT '2026-2027',
ADD COLUMN     "draftData" JSONB,
ADD COLUMN     "institutionId" TEXT,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SystemUser" ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "institutionId" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "permanentInstituteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trustName" TEXT NOT NULL,
    "institutionType" "InstitutionType" NOT NULL DEFAULT 'PRIVATE_SELF_FINANCED',
    "region" "Region" NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileHash" TEXT,
    "uploadedById" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeficiencyNotice" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "noticeNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameterName" TEXT,
    "requirementRef" TEXT,
    "issuedById" TEXT NOT NULL,
    "issuedByName" TEXT NOT NULL,
    "issuedRole" "UserRole" NOT NULL DEFAULT 'SCRUTINY_OFFICER',
    "isReleased" BOOLEAN NOT NULL DEFAULT false,
    "releasedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "institutionResponse" TEXT,
    "responseSubmittedAt" TIMESTAMP(3),
    "responseDocumentRef" TEXT,
    "officerReviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeficiencyNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "institutionId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_permanentInstituteId_key" ON "Institution"("permanentInstituteId");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_contactEmail_key" ON "Institution"("contactEmail");

-- CreateIndex
CREATE INDEX "Institution_region_idx" ON "Institution"("region");

-- CreateIndex
CREATE INDEX "Institution_permanentInstituteId_idx" ON "Institution"("permanentInstituteId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_institutionId_idx" ON "ApplicationDocument"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "DeficiencyNotice_noticeNumber_key" ON "DeficiencyNotice"("noticeNumber");

-- CreateIndex
CREATE INDEX "DeficiencyNotice_applicationId_idx" ON "DeficiencyNotice"("applicationId");

-- CreateIndex
CREATE INDEX "DeficiencyNotice_isReleased_status_idx" ON "DeficiencyNotice"("isReleased", "status");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_idx" ON "Notification"("recipientUserId");

-- CreateIndex
CREATE INDEX "Notification_institutionId_idx" ON "Notification"("institutionId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Application_institutionId_idx" ON "Application"("institutionId");

-- CreateIndex
CREATE INDEX "Application_isDraft_idx" ON "Application"("isDraft");

-- CreateIndex
CREATE INDEX "SystemUser_institutionId_idx" ON "SystemUser"("institutionId");

-- AddForeignKey
ALTER TABLE "SystemUser" ADD CONSTRAINT "SystemUser_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeficiencyNotice" ADD CONSTRAINT "DeficiencyNotice_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
