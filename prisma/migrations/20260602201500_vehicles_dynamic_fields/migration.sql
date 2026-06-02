-- Fordon: ta bort hårdkodade brand/model (blir dynamiska fält) och lägg till
-- chassinummer. Lägg till dynamiska fältdefinitioner, fältvärden och
-- mätarställningshistorik.

ALTER TABLE "vehicles" DROP COLUMN "brand",
DROP COLUMN "model",
ADD COLUMN "chassisNumber" TEXT;

-- Dynamiska fältdefinitioner per tenant
CREATE TABLE "vehicle_field_definitions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vehicle_field_definitions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vehicle_field_definitions_organizationId_idx" ON "vehicle_field_definitions"("organizationId");

-- Fältvärden per fordon
CREATE TABLE "vehicle_field_values" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "vehicle_field_values_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vehicle_field_values_vehicleId_definitionId_key" ON "vehicle_field_values"("vehicleId", "definitionId");
CREATE INDEX "vehicle_field_values_vehicleId_idx" ON "vehicle_field_values"("vehicleId");

-- Mätarställningshistorik
CREATE TABLE "odometer_readings" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "odometer_readings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "odometer_readings_vehicleId_idx" ON "odometer_readings"("vehicleId");

-- Foreign keys
ALTER TABLE "vehicle_field_definitions" ADD CONSTRAINT "vehicle_field_definitions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_field_values" ADD CONSTRAINT "vehicle_field_values_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_field_values" ADD CONSTRAINT "vehicle_field_values_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "vehicle_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "odometer_readings" ADD CONSTRAINT "odometer_readings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
