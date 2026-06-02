-- AlterTable
ALTER TABLE "accounts" RENAME CONSTRAINT "account_pkey" TO "accounts_pkey";

-- AlterTable
ALTER TABLE "invitations" RENAME CONSTRAINT "invitation_pkey" TO "invitations_pkey";

-- AlterTable
ALTER TABLE "jobs" RENAME CONSTRAINT "job_pkey" TO "jobs_pkey";

-- AlterTable
ALTER TABLE "mechanics" RENAME CONSTRAINT "mechanic_pkey" TO "mechanics_pkey";

-- AlterTable
ALTER TABLE "members" RENAME CONSTRAINT "member_pkey" TO "members_pkey";

-- AlterTable
ALTER TABLE "organizations" RENAME CONSTRAINT "organization_pkey" TO "organizations_pkey";

-- AlterTable
ALTER TABLE "sessions" RENAME CONSTRAINT "session_pkey" TO "sessions_pkey";

-- AlterTable
ALTER TABLE "users" RENAME CONSTRAINT "user_pkey" TO "users_pkey";

-- AlterTable
ALTER TABLE "vehicles" RENAME CONSTRAINT "vehicle_pkey" TO "vehicles_pkey";

-- AlterTable
ALTER TABLE "verifications" RENAME CONSTRAINT "verification_pkey" TO "verifications_pkey";

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personalNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_comments" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_organizationId_idx" ON "customers"("organizationId");

-- CreateIndex
CREATE INDEX "customer_comments_customerId_idx" ON "customer_comments"("customerId");

-- RenameForeignKey
ALTER TABLE "accounts" RENAME CONSTRAINT "account_userId_fkey" TO "accounts_userId_fkey";

-- RenameForeignKey
ALTER TABLE "invitations" RENAME CONSTRAINT "invitation_inviterId_fkey" TO "invitations_inviterId_fkey";

-- RenameForeignKey
ALTER TABLE "invitations" RENAME CONSTRAINT "invitation_organizationId_fkey" TO "invitations_organizationId_fkey";

-- RenameForeignKey
ALTER TABLE "jobs" RENAME CONSTRAINT "job_mechanicId_fkey" TO "jobs_mechanicId_fkey";

-- RenameForeignKey
ALTER TABLE "jobs" RENAME CONSTRAINT "job_organizationId_fkey" TO "jobs_organizationId_fkey";

-- RenameForeignKey
ALTER TABLE "jobs" RENAME CONSTRAINT "job_vehicleId_fkey" TO "jobs_vehicleId_fkey";

-- RenameForeignKey
ALTER TABLE "mechanics" RENAME CONSTRAINT "mechanic_organizationId_fkey" TO "mechanics_organizationId_fkey";

-- RenameForeignKey
ALTER TABLE "members" RENAME CONSTRAINT "member_organizationId_fkey" TO "members_organizationId_fkey";

-- RenameForeignKey
ALTER TABLE "members" RENAME CONSTRAINT "member_userId_fkey" TO "members_userId_fkey";

-- RenameForeignKey
ALTER TABLE "sessions" RENAME CONSTRAINT "session_userId_fkey" TO "sessions_userId_fkey";

-- RenameForeignKey
ALTER TABLE "vehicles" RENAME CONSTRAINT "vehicle_organizationId_fkey" TO "vehicles_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_comments" ADD CONSTRAINT "customer_comments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "account_userId_idx" RENAME TO "accounts_userId_idx";

-- RenameIndex
ALTER INDEX "invitation_email_idx" RENAME TO "invitations_email_idx";

-- RenameIndex
ALTER INDEX "invitation_organizationId_idx" RENAME TO "invitations_organizationId_idx";

-- RenameIndex
ALTER INDEX "job_organizationId_idx" RENAME TO "jobs_organizationId_idx";

-- RenameIndex
ALTER INDEX "mechanic_organizationId_idx" RENAME TO "mechanics_organizationId_idx";

-- RenameIndex
ALTER INDEX "member_organizationId_idx" RENAME TO "members_organizationId_idx";

-- RenameIndex
ALTER INDEX "member_userId_idx" RENAME TO "members_userId_idx";

-- RenameIndex
ALTER INDEX "organization_slug_key" RENAME TO "organizations_slug_key";

-- RenameIndex
ALTER INDEX "session_token_key" RENAME TO "sessions_token_key";

-- RenameIndex
ALTER INDEX "session_userId_idx" RENAME TO "sessions_userId_idx";

-- RenameIndex
ALTER INDEX "user_email_key" RENAME TO "users_email_key";

-- RenameIndex
ALTER INDEX "vehicle_organizationId_idx" RENAME TO "vehicles_organizationId_idx";

-- RenameIndex
ALTER INDEX "verification_identifier_idx" RENAME TO "verifications_identifier_idx";
