-- Arbetsorder: flera mekaniker, flera fordon och dellista.

-- Kopplingstabell arbetsorder <-> mekaniker (användare)
CREATE TABLE "job_mechanics" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_mechanics_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_mechanics_jobId_idx" ON "job_mechanics"("jobId");
CREATE INDEX "job_mechanics_userId_idx" ON "job_mechanics"("userId");
CREATE UNIQUE INDEX "job_mechanics_jobId_userId_key" ON "job_mechanics"("jobId", "userId");
ALTER TABLE "job_mechanics" ADD CONSTRAINT "job_mechanics_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_mechanics" ADD CONSTRAINT "job_mechanics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Kopplingstabell arbetsorder <-> fordon
CREATE TABLE "job_vehicles" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_vehicles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_vehicles_jobId_idx" ON "job_vehicles"("jobId");
CREATE INDEX "job_vehicles_vehicleId_idx" ON "job_vehicles"("vehicleId");
CREATE UNIQUE INDEX "job_vehicles_jobId_vehicleId_key" ON "job_vehicles"("jobId", "vehicleId");
ALTER TABLE "job_vehicles" ADD CONSTRAINT "job_vehicles_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_vehicles" ADD CONSTRAINT "job_vehicles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Inköp/del på en arbetsorder
CREATE TABLE "job_parts" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceExclOre" INTEGER NOT NULL,
    "vatRate" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_parts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_parts_jobId_idx" ON "job_parts"("jobId");
ALTER TABLE "job_parts" ADD CONSTRAINT "job_parts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: behåll befintlig mekaniker/fordon på varje arbetsorder.
INSERT INTO "job_mechanics" ("id", "jobId", "userId", "createdAt")
SELECT gen_random_uuid()::text, "id", "assignedUserId", now()
FROM "jobs" WHERE "assignedUserId" IS NOT NULL;

INSERT INTO "job_vehicles" ("id", "jobId", "vehicleId", "createdAt")
SELECT gen_random_uuid()::text, "id", "vehicleId", now()
FROM "jobs" WHERE "vehicleId" IS NOT NULL;
