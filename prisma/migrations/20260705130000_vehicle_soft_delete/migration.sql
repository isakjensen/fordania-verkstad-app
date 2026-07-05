-- Mjukradering av fordon: borttagna döljs men kan återställas
ALTER TABLE "vehicles" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "vehicles_organizationId_deletedAt_idx" ON "vehicles"("organizationId", "deletedAt");
