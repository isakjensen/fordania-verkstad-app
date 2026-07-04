"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, getActiveOrganizationId } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export type ActionResult = { success: true } | { error: string };

const NO_ORG =
  "Du tillhör ingen verkstad. Kunder hanteras per verkstad – logga in som en verkstadsanvändare.";

/** Skapar en ny kund i den inloggade användarens tenant. */
export async function createCustomer(
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Namn krävs." };

  const created = await db.customer.create({
    data: {
      organizationId,
      name,
      personalNumber: str(formData.get("personalNumber")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
    },
  });

  await recordAudit({
    action: "customer.create",
    category: "customer",
    summary: `Skapade kunden ${name}`,
    organizationId,
    entityType: "customer",
    entityId: created.id,
  });

  revalidatePath("/kunder");
  return { success: true };
}

/** Uppdaterar en kund – men bara om den tillhör användarens tenant. */
export async function updateCustomer(
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Kund-id saknas." };
  if (!name) return { error: "Namn krävs." };

  const existing = await db.customer.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return { error: "Kunden hittades inte." };

  await db.customer.update({
    where: { id },
    data: {
      name,
      personalNumber: str(formData.get("personalNumber")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
    },
  });

  await recordAudit({
    action: "customer.update",
    category: "customer",
    summary: `Uppdaterade kunden ${name}`,
    organizationId,
    entityType: "customer",
    entityId: id,
  });

  revalidatePath("/kunder");
  revalidatePath(`/kunder/${id}`);
  return { success: true };
}

/** Tar bort en kund (och dess kommentarer via cascade) inom tenanten. */
export async function deleteCustomer(id: string): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const existing = await db.customer.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return { error: "Kunden hittades inte." };

  await db.customer.delete({ where: { id } });

  await recordAudit({
    action: "customer.delete",
    category: "customer",
    summary: `Tog bort kunden ${existing.name}`,
    organizationId,
    entityType: "customer",
    entityId: id,
  });

  revalidatePath("/kunder");
  return { success: true };
}

/** Lägger till en kommentar på en kund inom tenanten. */
export async function addComment(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const customerId = String(formData.get("customerId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!customerId) return { error: "Kund-id saknas." };
  if (!text) return { error: "Skriv en kommentar först." };

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId },
  });
  if (!customer) return { error: "Kunden hittades inte." };

  await db.customerComment.create({
    data: {
      customerId,
      text,
      authorName: session.user.name,
    },
  });

  revalidatePath(`/kunder/${customerId}`);
  return { success: true };
}

/** Tar bort en kommentar (kontrollerar att den tillhör tenantens kund). */
export async function deleteComment(id: string): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const comment = await db.customerComment.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!comment || comment.customer.organizationId !== organizationId) {
    return { error: "Kommentaren hittades inte." };
  }

  await db.customerComment.delete({ where: { id } });
  revalidatePath(`/kunder/${comment.customerId}`);
  return { success: true };
}

/**
 * Kopplar en kund till ett fordon (många-till-många). Kontrollerar att BÅDA
 * tillhör tenanten innan kopplingen skapas. Idempotent via unik (kund, fordon).
 */
export async function linkVehicle(
  customerId: string,
  vehicleId: string,
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  if (!customerId || !vehicleId) return { error: "Kund eller fordon saknas." };

  const [customer, vehicle] = await Promise.all([
    db.customer.findFirst({ where: { id: customerId, organizationId } }),
    db.vehicle.findFirst({ where: { id: vehicleId, organizationId } }),
  ]);
  if (!customer) return { error: "Kunden hittades inte." };
  if (!vehicle) return { error: "Fordonet hittades inte." };

  await db.customerVehicle.upsert({
    where: { customerId_vehicleId: { customerId, vehicleId } },
    create: { customerId, vehicleId },
    update: {},
  });

  revalidatePath(`/kunder/${customerId}`);
  revalidatePath(`/fordon/${vehicleId}`);
  return { success: true };
}

/** Tar bort kopplingen mellan en kund och ett fordon inom tenanten. */
export async function unlinkVehicle(
  customerId: string,
  vehicleId: string,
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  // Säkerställ att kopplingen tillhör tenanten via kundens organizationId.
  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId },
  });
  if (!customer) return { error: "Kunden hittades inte." };

  await db.customerVehicle.deleteMany({ where: { customerId, vehicleId } });

  revalidatePath(`/kunder/${customerId}`);
  revalidatePath(`/fordon/${vehicleId}`);
  return { success: true };
}

/** Hjälpare: trimmar och gör tomma strängar till null. */
function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}
