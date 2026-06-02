import "server-only";
import { db } from "@/lib/db";

/** Tenantens dynamiska fältdefinitioner för fordon, i visningsordning. */
export async function getFieldDefinitions(organizationId: string) {
  return db.vehicleFieldDefinition.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Alla fordon för en tenant, med dynamiska fältvärden och den senaste
 * mätarställningen (hela historiken hämtas i detaljvyn i stället).
 */
export async function getVehicles(organizationId: string) {
  return db.vehicle.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      fieldValues: { include: { definition: true } },
      odometer: { orderBy: { readingDate: "desc" }, take: 1 },
      _count: { select: { customers: true } },
    },
  });
}

/**
 * Ett enskilt fordon med fältvärden, HELA mätarställningshistoriken och
 * kopplade kunder. Scopas på organizationId så en tenant inte kan öppna en
 * annans fordon.
 */
export async function getVehicle(id: string, organizationId: string) {
  return db.vehicle.findFirst({
    where: { id, organizationId },
    include: {
      fieldValues: { include: { definition: true } },
      odometer: { orderBy: { readingDate: "desc" } },
      customers: {
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Enkel lista över tenantens fordon (id + reg.nr) för kopplingsväljare. */
export async function getVehicleOptions(organizationId: string) {
  return db.vehicle.findMany({
    where: { organizationId },
    orderBy: { regNo: "asc" },
    select: { id: true, regNo: true, chassisNumber: true },
  });
}

export type VehicleListItem = Awaited<ReturnType<typeof getVehicles>>[number];
export type VehicleDetail = NonNullable<Awaited<ReturnType<typeof getVehicle>>>;
export type FieldDefinition = Awaited<
  ReturnType<typeof getFieldDefinitions>
>[number];
