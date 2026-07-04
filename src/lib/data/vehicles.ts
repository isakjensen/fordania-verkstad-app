import "server-only";
import { db } from "@/lib/db";
import { fetchFordaniaVehicles, FordaniaSyncError } from "@/lib/fordania";

export interface FordaniaSyncPreview {
  /** Fordon i Fordania vars reg.nr ännu inte finns i verkstaden. */
  newVehicles: { plate: string; model: string | null }[];
  /** Antal fordon i Fordania som redan finns (matchar på reg.nr). */
  existingCount: number;
  /** Totalt antal fordon Fordania returnerade. */
  total: number;
  /** Satt om Fordania inte kunde nås – då visas ingen räknare. */
  error?: string;
}

/**
 * Jämför Fordanias fordon mot verkstadens register utan att ändra något.
 * Används för att visa "N nya att hämta" vid synk-knappen. Kastar aldrig –
 * vid fel returneras en tom preview med `error` satt.
 */
export async function getFordaniaSyncPreview(
  organizationId: string,
): Promise<FordaniaSyncPreview> {
  let incoming;
  try {
    incoming = await fetchFordaniaVehicles();
  } catch (err) {
    const error =
      err instanceof FordaniaSyncError
        ? err.message
        : "Kunde inte kontrollera Fordania just nu.";
    return { newVehicles: [], existingCount: 0, total: 0, error };
  }

  const existing = await db.vehicle.findMany({
    where: { organizationId },
    select: { regNo: true },
  });
  const existingSet = new Set(existing.map((v) => v.regNo.trim().toUpperCase()));

  const newVehicles: { plate: string; model: string | null }[] = [];
  const seen = new Set<string>();
  let existingCount = 0;

  for (const v of incoming) {
    const reg = String(v.plate ?? "").trim().toUpperCase();
    if (!reg) continue;
    if (existingSet.has(reg)) {
      existingCount++;
      continue;
    }
    if (seen.has(reg)) continue; // dubblett i Fordania-svaret
    seen.add(reg);
    newVehicles.push({ plate: v.plate.trim(), model: v.model?.trim() || null });
  }

  return { newVehicles, existingCount, total: incoming.length };
}

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
