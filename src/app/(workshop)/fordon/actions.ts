"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, getActiveOrganizationId } from "@/lib/session";

export type ActionResult = { success: true } | { error: string };

const NO_ORG =
  "Du tillhör ingen verkstad. Fordon hanteras per verkstad – välj en verkstad först.";

function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
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

  const regNo = String(formData.get("regNo") ?? "").trim().toUpperCase();
  if (!regNo) return { error: "Registreringsnummer krävs." };

  const fields = await readFieldValues(organizationId, formData);
  const fieldValues = fields.filter((f) => f.value.length > 0);

  const odoRaw = String(formData.get("odometer") ?? "").trim();
  const odoValue = odoRaw ? Number.parseInt(odoRaw, 10) : null;

  await db.vehicle.create({
    data: {
      organizationId,
      regNo,
      brand: str(formData.get("brand")),
      model: str(formData.get("model")),
      chassisNumber: str(formData.get("chassisNumber")),
      fieldValues: { create: fieldValues },
      ...(odoValue !== null && Number.isFinite(odoValue)
        ? { odometer: { create: { value: odoValue } } }
        : {}),
    },
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
  const regNo = String(formData.get("regNo") ?? "").trim().toUpperCase();
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

  revalidatePath("/fordon");
  revalidatePath(`/fordon/${id}`);
  return { success: true };
}

/** Tar bort ett fordon (och dess fältvärden + mätarställningar via cascade). */
export async function deleteVehicle(id: string): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const existing = await db.vehicle.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return { error: "Fordonet hittades inte." };

  await db.vehicle.delete({ where: { id } });
  revalidatePath("/fordon");
  return { success: true };
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
