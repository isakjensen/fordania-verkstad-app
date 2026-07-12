-- Timlön (arbetskostnad) per mekaniker på en arbetsorder.
-- Nullbara kolumner + default på vatRate => befintliga rader förblir giltiga.
ALTER TABLE "job_mechanics"
  ADD COLUMN "hourlyRateOreExcl" INTEGER,
  ADD COLUMN "hours" DOUBLE PRECISION,
  ADD COLUMN "vatRate" INTEGER NOT NULL DEFAULT 25;
