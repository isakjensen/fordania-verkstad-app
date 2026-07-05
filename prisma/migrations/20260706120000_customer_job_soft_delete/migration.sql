-- Mjukradering av kunder och arbetsordrar: borttagna döljs men kan återställas
ALTER TABLE "customers" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "customers_organizationId_deletedAt_idx" ON "customers"("organizationId", "deletedAt");

ALTER TABLE "jobs" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "jobs_organizationId_deletedAt_idx" ON "jobs"("organizationId", "deletedAt");
