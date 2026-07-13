"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  requireUser,
  getActiveOrganizationId,
  getTenantRole,
  canManageUsers,
} from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { fetchFordaniaVehicles, FordaniaSyncError } from "@/lib/fordania";
import {
  getFordaniaSyncPreview,
  type FordaniaSyncPreview,
} from "@/lib/data/vehicles";

export type ActionResult = { success: true } | { error: string };

export type SyncResult =
  | { success: true; created: number; updated: number; total: number }
  | { error: string };

const NO_ORG =
  "Du tillhör ingen verkstad. Fordon hanteras per verkstad – välj en verkstad först.";

const NOT_ADMIN =
  "Endast administratörer kan synka fordon från Fordania.";

function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

/** Tolkar ett årtal (4 siffror); ogiltigt/tomt → null. */
function parseYear(raw: string | null): number | null {
  const s = String(raw ?? "").trim();
  const m = s.match(/\d{4}/);
  if (!m) return null;
  const n = Number.parseInt(m[0], 10);
  return n >= 1900 && n <= 2100 ? n : null;
}

/** Årtal ur ett formulärfält. */
function year(value: FormDataEntryValue | null): number | null {
  return parseYear(value === null ? null : String(value));
}

/** Läser de dynamiska fältvärdena ur formuläret (ett per definition). */
async function readFieldValues(organizationId: string, formData: FormData) {
  const definitions = await db.vehicleFieldDefinition.findMany({
    where: { organizationId },
  });
  return definitions.map((def) => ({
    definitionId: def.id,
    value: String(formData.get(`field_${def.id}`) ?? "").trim(),
  }));
}

/** Skapar ett fordon med statiska + dynamiska fält och ev. mätarställning. */
export async function createVehicle(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const regNo = String(formData.get("regNo") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!regNo) return { error: "Registreringsnummer krävs." };

  const fields = await readFieldValues(organizationId, formData);
  const fieldValues = fields.filter((f) => f.value.length > 0);

  const odoRaw = String(formData.get("odometer") ?? "").trim();
  const odoValue = odoRaw ? Number.parseInt(odoRaw, 10) : null;

  const created = await db.vehicle.create({
    data: {
      organizationId,
      regNo,
      brand: str(formData.get("brand")),
      model: str(formData.get("model")),
      year: year(formData.get("year")),
      chassisNumber: str(formData.get("chassisNumber")),
      fieldValues: { create: fieldValues },
      ...(odoValue !== null && Number.isFinite(odoValue)
        ? { odometer: { create: { value: odoValue } } }
        : {}),
    },
  });

  await recordAudit({
    action: "vehicle.create",
    category: "vehicle",
    summary: `Lade till fordonet ${regNo}`,
    organizationId,
    entityType: "vehicle",
    entityId: created.id,
  });

  revalidatePath("/fordon");
  return { success: true };
}

/** Uppdaterar statiska + dynamiska fält på ett fordon inom tenanten. */
export async function updateVehicle(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const id = String(formData.get("id") ?? "");
  const regNo = String(formData.get("regNo") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!id) return { error: "Fordons-id saknas." };
  if (!regNo) return { error: "Registreringsnummer krävs." };

  const existing = await db.vehicle.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return { error: "Fordonet hittades inte." };

  await db.vehicle.update({
    where: { id },
    data: {
      regNo,
      brand: str(formData.get("brand")),
      model: str(formData.get("model")),
      year: year(formData.get("year")),
      chassisNumber: str(formData.get("chassisNumber")),
    },
  });

  // Upsert/ta bort dynamiska fältvärden
  const fields = await readFieldValues(organizationId, formData);
  for (const f of fields) {
    if (f.value.length) {
      await db.vehicleFieldValue.upsert({
        where: {
          vehicleId_definitionId: {
            vehicleId: id,
            definitionId: f.definitionId,
          },
        },
        create: {
          vehicleId: id,
          definitionId: f.definitionId,
          value: f.value,
        },
        update: { value: f.value },
      });
    } else {
      await db.vehicleFieldValue.deleteMany({
        where: { vehicleId: id, definitionId: f.definitionId },
      });
    }
  }

  await recordAudit({
    action: "vehicle.update",
    category: "vehicle",
    summary: `Uppdaterade fordonet ${regNo}`,
    organizationId,
    entityType: "vehicle",
    entityId: id,
  });

  revalidatePath("/fordon");
  revalidatePath(`/fordon/${id}`);
  return { success: true };
}

/**
 * Mjukraderar ett fordon: sätter `deletedAt` så det döljs överallt men kan
 * återställas. Historik (arbetsordrar, mätarställningar) rörs inte.
 */
export async function deleteVehicle(id: string): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const existing = await db.vehicle.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!existing) return { error: "Fordonet hittades inte." };

  await db.vehicle.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await recordAudit({
    action: "vehicle.delete",
    category: "vehicle",
    summary: `Tog bort fordonet ${existing.regNo}`,
    organizationId,
    entityType: "vehicle",
    entityId: id,
  });

  revalidatePath("/fordon");
  return { success: true };
}

/** Återställer ett mjukraderat fordon så det blir aktivt igen. */
export async function restoreVehicle(id: string): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const existing = await db.vehicle.findFirst({
    where: { id, organizationId, deletedAt: { not: null } },
  });
  if (!existing) return { error: "Fordonet hittades inte bland de borttagna." };

  await db.vehicle.update({
    where: { id },
    data: { deletedAt: null },
  });

  await recordAudit({
    action: "vehicle.restore",
    category: "vehicle",
    summary: `Återställde fordonet ${existing.regNo}`,
    organizationId,
    entityType: "vehicle",
    entityId: id,
  });

  revalidatePath("/fordon");
  return { success: true };
}

/** Mjukraderar flera fordon på en gång (tenant-scopat). Returnerar antalet. */
export async function deleteVehicles(
  ids: string[],
): Promise<{ success: true; count: number } | { error: string }> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const clean = [...new Set(ids.filter(Boolean))];
  if (clean.length === 0) return { error: "Inga fordon valda." };

  // Scopa till tenanten och hämta reg.nr för loggen innan borttagningen.
  const targets = await db.vehicle.findMany({
    where: { id: { in: clean }, organizationId, deletedAt: null },
    select: { id: true, regNo: true },
  });
  if (targets.length === 0) return { error: "Fordonen hittades inte." };

  const { count } = await db.vehicle.updateMany({
    where: { id: { in: targets.map((t) => t.id) }, organizationId },
    data: { deletedAt: new Date() },
  });

  const regs = targets.map((t) => t.regNo);
  const regList =
    regs.length > 10 ? `${regs.slice(0, 10).join(", ")} m.fl.` : regs.join(", ");
  await recordAudit({
    action: "vehicle.delete",
    category: "vehicle",
    summary: `Tog bort ${count} fordon (${regList})`,
    organizationId,
    entityType: "vehicle",
  });

  revalidatePath("/fordon");
  return { success: true, count };
}

/** Lägger till en ny mätarställning (sparar historiken, nyaste visas). */
export async function addOdometerReading(
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const vehicleId = String(formData.get("vehicleId") ?? "");
  const valueRaw = String(formData.get("value") ?? "").trim();
  const value = Number.parseInt(valueRaw, 10);
  if (!vehicleId) return { error: "Fordons-id saknas." };
  if (!valueRaw || !Number.isFinite(value) || value < 0) {
    return { error: "Ange en giltig mätarställning." };
  }

  const vehicle = await db.vehicle.findFirst({
    where: { id: vehicleId, organizationId },
  });
  if (!vehicle) return { error: "Fordonet hittades inte." };

  const dateRaw = String(formData.get("readingDate") ?? "").trim();
  const readingDate = dateRaw ? new Date(dateRaw) : new Date();

  await db.odometerReading.create({
    data: { vehicleId, value, readingDate },
  });

  revalidatePath(`/fordon/${vehicleId}`);
  return { success: true };
}

// --------------------------------------------------------------------- //
//  Synk från Fordania (huvudappen) – hämtar fordon via publika API:et
// --------------------------------------------------------------------- //

/**
 * Kollar mot Fordania och räknar ut vilka fordon som är nya – utan att ändra
 * något. Anropas på begäran (när knappen trycks), inte vid sidladdning.
 */
export async function previewFordaniaSync(): Promise<FordaniaSyncPreview> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) {
    return {
      newVehicles: [],
      existingCount: 0,
      overwrites: [],
      total: 0,
      error: NO_ORG,
    };
  }
  if (!canManageUsers(await getTenantRole(organizationId))) {
    return {
      newVehicles: [],
      existingCount: 0,
      overwrites: [],
      total: 0,
      error: NOT_ADMIN,
    };
  }
  return getFordaniaSyncPreview(organizationId);
}

/**
 * Hämtar fordon från Fordania och synkar in dem i den aktiva verkstaden.
 * Matchar på registreringsnummer: nya fordon skapas, befintliga uppdateras.
 * `year`/`color` mappas till de dynamiska fälten Årsmodell/Färg om verkstaden
 * definierat sådana – annars ignoreras de.
 */
export async function syncVehiclesFromFordania(): Promise<SyncResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };
  if (!canManageUsers(await getTenantRole(organizationId))) {
    return { error: NOT_ADMIN };
  }

  let incoming;
  try {
    incoming = await fetchFordaniaVehicles();
  } catch (err) {
    if (err instanceof FordaniaSyncError) return { error: err.message };
    console.error("syncVehiclesFromFordania misslyckades:", err);
    return { error: "Ett oväntat fel inträffade vid synkningen mot Fordania." };
  }

  // Dynamiska fältdefinitioner: hitta ev. Årsmodell/Färg för att kunna mappa.
  const definitions = await db.vehicleFieldDefinition.findMany({
    where: { organizationId },
  });
  const yearDef = definitions.find((d) => /år(smod|tal)?/i.test(d.label));
  const colorDef = definitions.find((d) => /färg|color/i.test(d.label));

  // Befintliga fordon i verkstaden, indexerade på normaliserat reg.nr.
  // Inkluderar borttagna: de ska varken uppdateras eller återskapas (då skulle
  // en dubblett skapas) – borttaget förblir borttaget tills det återställs.
  const existing = await db.vehicle.findMany({
    where: { organizationId },
    select: { id: true, regNo: true, deletedAt: true },
  });
  const byReg = new Map(existing.map((v) => [v.regNo.toUpperCase(), v]));

  let created = 0;
  let updated = 0;

  for (const v of incoming) {
    const regNo = String(v.plate ?? "").trim().toUpperCase();
    if (!regNo) continue;

    const model = v.model?.trim() || null;
    const yr = parseYear(v.year);
    const match = byReg.get(regNo);

    // Borttaget fordon: rör det inte alls.
    if (match?.deletedAt) continue;
    const vehicleId = match?.id;

    if (vehicleId) {
      // Uppdatera bara fält där Fordania har ett värde – rör inte annat.
      if (model || yr !== null) {
        await db.vehicle.update({
          where: { id: vehicleId },
          data: { ...(model ? { model } : {}), ...(yr !== null ? { year: yr } : {}) },
        });
      }
      await syncDynamicFields(vehicleId, v, yearDef, colorDef);
      updated++;
    } else {
      const createdVehicle = await db.vehicle.create({
        data: { organizationId, regNo, model, year: yr },
      });
      byReg.set(regNo, {
        id: createdVehicle.id,
        regNo: createdVehicle.regNo,
        deletedAt: null,
      });
      await syncDynamicFields(createdVehicle.id, v, yearDef, colorDef);
      created++;
    }
  }

  await recordAudit({
    action: "vehicle.sync",
    category: "vehicle",
    summary: `Synkade fordon från Fordania (${created} nya, ${updated} uppdaterade)`,
    organizationId,
    entityType: "vehicle",
  });

  revalidatePath("/fordon");
  return { success: true, created, updated, total: incoming.length };
}

/** Sätter Årsmodell/Färg som dynamiska fältvärden om definitionerna finns. */
async function syncDynamicFields(
  vehicleId: string,
  v: { year: string | null; color: string | null },
  yearDef: { id: string } | undefined,
  colorDef: { id: string } | undefined,
) {
  const pairs: Array<[string, string | null]> = [
    ...(yearDef ? [[yearDef.id, v.year] as [string, string | null]] : []),
    ...(colorDef ? [[colorDef.id, v.color] as [string, string | null]] : []),
  ];
  for (const [definitionId, raw] of pairs) {
    const value = raw?.trim();
    if (!value) continue;
    await db.vehicleFieldValue.upsert({
      where: { vehicleId_definitionId: { vehicleId, definitionId } },
      create: { vehicleId, definitionId, value },
      update: { value },
    });
  }
}

// --------------------------------------------------------------------- //
//  Dynamiska fältdefinitioner (hanteras av tenant-admin i inställningar)
// --------------------------------------------------------------------- //

const VALID_TYPES = ["text", "number", "date"];

export async function createFieldDefinition(
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "text");
  if (!label) return { error: "Fältnamn krävs." };

  const last = await db.vehicleFieldDefinition.findFirst({
    where: { organizationId },
    orderBy: { sortOrder: "desc" },
  });

  await db.vehicleFieldDefinition.create({
    data: {
      organizationId,
      label,
      type: VALID_TYPES.includes(type) ? type : "text",
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/installningar");
  revalidatePath("/fordon");
  return { success: true };
}

export async function deleteFieldDefinition(
  id: string,
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const def = await db.vehicleFieldDefinition.findFirst({
    where: { id, organizationId },
  });
  if (!def) return { error: "Fältet hittades inte." };

  await db.vehicleFieldDefinition.delete({ where: { id } });
  revalidatePath("/installningar");
  revalidatePath("/fordon");
  return { success: true };
}
