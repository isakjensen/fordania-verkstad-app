-- Arbetskalender: koppla arbetsorder till tilldelad användare (member) och
-- ge den riktig tidsplacering + beskrivning.
ALTER TABLE "jobs" ADD COLUMN "assignedUserId" TEXT;
ALTER TABLE "jobs" ADD COLUMN "scheduledStart" TIMESTAMP(3);
ALTER TABLE "jobs" ADD COLUMN "scheduledEnd" TIMESTAMP(3);
ALTER TABLE "jobs" ADD COLUMN "description" TEXT;

-- CreateIndex
CREATE INDEX "jobs_assignedUserId_idx" ON "jobs"("assignedUserId");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
