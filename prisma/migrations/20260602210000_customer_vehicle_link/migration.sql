-- Kopplingstabell kund ↔ fordon (många-till-många)
CREATE TABLE "customer_vehicles" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_vehicles_customerId_idx" ON "customer_vehicles"("customerId");

-- CreateIndex
CREATE INDEX "customer_vehicles_vehicleId_idx" ON "customer_vehicles"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_vehicles_customerId_vehicleId_key" ON "customer_vehicles"("customerId", "vehicleId");

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
