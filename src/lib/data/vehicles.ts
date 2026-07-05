import "server-only";
import { db } from "@/lib/db";
import {
  fetchFordaniaVehicles,
  FordaniaSyncError,
  type FordaniaVehicle,
} from "@/lib/fordania";

/** Ett fält som skulle skrivas över vid synk (verkstadens värde → Fordanias). */
export interface SyncFieldChange {
  label: string;
  from: string;
  to: string;
}

/** Ett befintligt fordon vars redan ifyllda uppgifter Fordania skulle ersätta. */
export interface SyncOverwrite {
  plate: string;
  changes: SyncFieldChange[];
}

export interface FordaniaSyncPreview {
  /** Fordon i Fordania vars reg.nr ännu inte finns i verkstaden. */
  newVehicles: { plate: string; model: string | null }[];
  /** Antal fordon i Fordania som redan finns (matchar på reg.nr). */
  existingCount: number;
  /**
   * Befintliga fordon där Fordania skulle skriva över ett värde som redan är
   * ifyllt i verkstaden (t.ex. något man ändrat manuellt). Tomt = inget riskeras.
   */
  overwrites: SyncOverwrite[];
  /** Totalt antal fordon Fordania returnerade. */
  total: number;
  /** Satt om Fordania inte kunde nås – då visas ingen räknare. */
  error?: string;
}

const norm = (v: unknown) => String(v ?? "").trim();

/** Tolkar ett årtal (4 siffror) i intervallet 1900–2100; annars null. */
function parseYear(raw: string | null): number | null {
  const m = norm(raw).match(/\d{4}/);
  if (!m) return null;
  const n = Number.parseInt(m[0], 10);
  return n >= 1900 && n <= 2100 ? n : null;
}

/**
 * Räknar ut vilka redan ifyllda fält på ett befintligt fordon som Fordania
 * skulle ändra. Ett fält räknas bara som överskrivning om verkstaden HAR ett
 * värde och Fordanias skiljer sig – att fylla i ett tomt fält är ingen förlust.
 */
function diffOverwrite(
  cur: {
    model: string | null;
    year: number | null;
    fieldValues: { definitionId: string; value: string }[];
  },
  v: FordaniaVehicle,
  yearDef: { id: string; label: string } | undefined,
  colorDef: { id: string; label: string } | undefined,
): SyncFieldChange[] {
  const changes: SyncFieldChange[] = [];

  const inModel = norm(v.model);
  const curModel = norm(cur.model);
  if (inModel && curModel && inModel !== curModel) {
    changes.push({ label: "Modell", from: curModel, to: inModel });
  }

  const inYear = parseYear(v.year);
  if (inYear !== null && cur.year !== null && cur.year !== inYear) {
    changes.push({ label: "Årtal", from: String(cur.year), to: String(inYear) });
  }

  const valById = new Map(cur.fieldValues.map((fv) => [fv.definitionId, fv.value]));
  for (const [def, incoming] of [
    [yearDef, v.year],
    [colorDef, v.color],
  ] as const) {
    if (!def) continue;
    const inV = norm(incoming);
    const curV = norm(valById.get(def.id));
    if (inV && curV && inV !== curV) {
      changes.push({ label: def.label, from: curV, to: inV });
    }
  }

  return changes;
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
    return { newVehicles: [], existingCount: 0, overwrites: [], total: 0, error };
  }

  // Dynamiska fältdefinitioner (Årsmodell/Färg) – samma mappning som synken.
  const definitions = await db.vehicleFieldDefinition.findMany({
    where: { organizationId },
    select: { id: true, label: true },
  });
  const yearDef = definitions.find((d) => /år(smod|tal)?/i.test(d.label));
  const colorDef = definitions.find((d) => /färg|color/i.test(d.label));

  // Inkluderar borttagna fordon: deras reg.nr ska inte dyka upp som "nya"
  // (då skulle synken skapa en dubblett), men de ska inte heller uppdateras –
  // borttaget förblir borttaget tills det återställs manuellt.
  const existing = await db.vehicle.findMany({
    where: { organizationId },
    select: {
      regNo: true,
      model: true,
      year: true,
      deletedAt: true,
      fieldValues: { select: { definitionId: true, value: true } },
    },
  });
  const byReg = new Map(
    existing.map((v) => [v.regNo.trim().toUpperCase(), v]),
  );

  const newVehicles: { plate: string; model: string | null }[] = [];
  const overwrites: SyncOverwrite[] = [];
  const seen = new Set<string>();
  let existingCount = 0;

  for (const v of incoming) {
    const reg = String(v.plate ?? "").trim().toUpperCase();
    if (!reg) continue;
    const cur = byReg.get(reg);
    if (cur) {
      // Borttaget fordon: rör det inte alls (varken uppdatera eller återskapa).
      if (cur.deletedAt) continue;
      existingCount++;
      const changes = diffOverwrite(cur, v, yearDef, colorDef);
      if (changes.length) overwrites.push({ plate: v.plate.trim(), changes });
      continue;
    }
    if (seen.has(reg)) continue; // dubblett i Fordania-svaret
    seen.add(reg);
    newVehicles.push({ plate: v.plate.trim(), model: v.model?.trim() || null });
  }

  return { newVehicles, existingCount, overwrites, total: incoming.length };
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
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      fieldValues: { include: { definition: true } },
      odometer: { orderBy: { readingDate: "desc" }, take: 1 },
      _count: { select: { customers: true } },
    },
  });
}

/**
 * Borttagna (mjukraderade) fordon för en tenant, nyast borttagna först.
 * Används i "Borttagna fordon"-dialogen för att kunna återställa dem.
 */
export async function getRemovedVehicles(organizationId: string) {
  return db.vehicle.findMany({
    where: { organizationId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      regNo: true,
      brand: true,
      model: true,
      year: true,
      deletedAt: true,
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
    where: { id, organizationId, deletedAt: null },
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
    where: { organizationId, deletedAt: null },
    orderBy: { regNo: "asc" },
    select: { id: true, regNo: true, chassisNumber: true },
  });
}

export type VehicleListItem = Awaited<ReturnType<typeof getVehicles>>[number];
export type VehicleDetail = NonNullable<Awaited<ReturnType<typeof getVehicle>>>;
export type FieldDefinition = Awaited<
  ReturnType<typeof getFieldDefinitions>
>[number];
