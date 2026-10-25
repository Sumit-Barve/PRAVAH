-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'EVC_CONVENER';

-- AlterTable
ALTER TABLE "SystemUser" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "SystemUser_username_idx" ON "SystemUser"("username");
