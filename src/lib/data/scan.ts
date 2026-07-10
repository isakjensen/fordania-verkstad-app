import "server-only";
import { db } from "@/lib/db";

/**
 * Lätt fordonslista för skanning – bara det klienten behöver för att
 * fuzzy-matcha en avläst skylt mot verkstadens flotta. Liten payload.
 */
export async function getFleetForScan(organizationId: string) {
  return db.vehicle.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { regNo: "asc" },
    select: { id: true, regNo: true, brand: true, model: true },
  });
}

export type ScanFleetVehicle = Awaited<
  ReturnType<typeof getFleetForScan>
>[number];

/**
 * Fullständig bild av ett fordon för skanningsresultatet: statiska fält,
 * dynamiska fält, senaste mätarställning, kopplade kunder och alla aktiva
 * arbetsordrar (vad som ska göras). Scopas på organizationId.
 */
export async function getScanVehicle(vehicleId: string, organizationId: string) {
  return db.vehicle.findFirst({
    where: { id: vehicleId, organizationId, deletedAt: null },
    include: {
      fieldValues: { include: { definition: true } },
      odometer: { orderBy: { readingDate: "desc" }, take: 1 },
      customers: { include: { customer: true }, orderBy: { createdAt: "desc" } },
      jobs: {
        where: { deletedAt: null },
        orderBy: [{ scheduledStart: "asc" }, { createdAt: "desc" }],
        include: { assignedUser: { select: { name: true } } },
      },
    },
  });
}

export type ScanVehicle = NonNullable<
  Awaited<ReturnType<typeof getScanVehicle>>
>;
