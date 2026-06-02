-- Återinför märke och modell som fasta fält på fordon
ALTER TABLE "vehicles" ADD COLUMN "brand" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "model" TEXT;

-- Backfill: ge demobilarna (FRD 421) ett märke/modell
UPDATE "vehicles" SET "brand" = 'Volvo', "model" = 'XC60'
WHERE "regNo" = 'FRD 421' AND "brand" IS NULL;
