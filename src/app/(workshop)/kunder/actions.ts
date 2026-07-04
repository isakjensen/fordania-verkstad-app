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

  const type = normalizeType(formData.get("type"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: type === "company" ? "Företagsnamn krävs." : "Namn krävs." };
  }

  const orgResult = readOrgNumber(type, formData.get("orgNumber"));
  if ("error" in orgResult) return orgResult;

  // Vid företag kan en primär kontaktperson anges direkt i formuläret.
  const contactName = str(formData.get("contactName"));

  const created = await db.customer.create({
    data: {
      organizationId,
      type,
      name,
      // Endast fältet som matchar kundtypen sparas – håller datan ren.
      personalNumber:
        type === "private" ? str(formData.get("personalNumber")) : null,
      orgNumber: orgResult.value,
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
      contacts: contactName
        ? {
            create: [
              {
                name: contactName,
                role: type === "company" ? "Kontaktperson" : null,
                phone: str(formData.get("contactPhone")),
                email: str(formData.get("contactEmail")),
                isPrimary: true,
              },
            ],
          }
        : undefined,
    },
  });

  await recordAudit({
    action: "customer.create",
    category: "customer",
    summary: `Skapade ${type === "company" ? "företagskunden" : "kunden"} ${name}`,
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
  const type = normalizeType(formData.get("type"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Kund-id saknas." };
  if (!name) {
    return { error: type === "company" ? "Företagsnamn krävs." : "Namn krävs." };
  }

  const orgResult = readOrgNumber(type, formData.get("orgNumber"));
  if ("error" in orgResult) return orgResult;

  const existing = await db.customer.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return { error: "Kunden hittades inte." };

  // Att byta typ = konvertering privat ↔ företag. Rensa fältet som inte längre
  // gäller så att t.ex. ett personnummer inte ligger kvar på ett företag.
  const converted = existing.type !== type;

  await db.customer.update({
    where: { id },
    data: {
      type,
      name,
      personalNumber:
        type === "private" ? str(formData.get("personalNumber")) : null,
      orgNumber: orgResult.value,
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
    },
  });

  await recordAudit({
    action: "customer.update",
    category: "customer",
    summary: converted
      ? `Konverterade ${name} till ${
          type === "company" ? "företagskund" : "privatkund"
        }`
      : `Uppdaterade kunden ${name}`,
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

/**
 * Lägger till en kontaktperson på en kund. Gäller både privat och företag –
 * t.ex. någon som får lämna eller hämta ut fordonet. Markeras en som primär
 * flyttas den rollen från ev. tidigare primär kontakt.
 */
export async function addContact(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const customerId = String(formData.get("customerId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!customerId) return { error: "Kund-id saknas." };
  if (!name) return { error: "Namn på kontaktpersonen krävs." };

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId },
  });
  if (!customer) return { error: "Kunden hittades inte." };

  const isPrimary = bool(formData.get("isPrimary"));

  await db.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.customerContact.updateMany({
        where: { customerId },
        data: { isPrimary: false },
      });
    }
    await tx.customerContact.create({
      data: {
        customerId,
        name,
        role: str(formData.get("role")),
        phone: str(formData.get("phone")),
        email: str(formData.get("email")),
        isPrimary,
      },
    });
  });

  revalidatePath(`/kunder/${customerId}`);
  return { success: true };
}

/** Tar bort en kontaktperson (kontrollerar att den tillhör tenantens kund). */
export async function deleteContact(id: string): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const contact = await db.customerContact.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!contact || contact.customer.organizationId !== organizationId) {
    return { error: "Kontaktpersonen hittades inte." };
  }

  await db.customerContact.delete({ where: { id } });
  revalidatePath(`/kunder/${contact.customerId}`);
  return { success: true };
}

/** Markerar en kontaktperson som primär (företagets kontaktperson). */
export async function setPrimaryContact(id: string): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const contact = await db.customerContact.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!contact || contact.customer.organizationId !== organizationId) {
    return { error: "Kontaktpersonen hittades inte." };
  }

  await db.$transaction([
    db.customerContact.updateMany({
      where: { customerId: contact.customerId },
      data: { isPrimary: false },
    }),
    db.customerContact.update({
      where: { id },
      data: { isPrimary: true },
    }),
  ]);

  revalidatePath(`/kunder/${contact.customerId}`);
  return { success: true };
}

/** Normaliserar kundtypen till ett känt värde ("private" | "company"). */
function normalizeType(value: FormDataEntryValue | null): "private" | "company" {
  return String(value ?? "") === "company" ? "company" : "private";
}

const ORG_NUMBER_RE = /^\d{8}-\d{4}$/;

/**
 * Läser och validerar organisationsnummer för företag (format NNNNNNNN-NNNN –
 * 8 siffror, bindestreck, 4 siffror). Accepterar inmatning med eller utan
 * bindestreck/mellanslag och normaliserar. Krävs för företag, ignoreras för
 * privatpersoner.
 */
function readOrgNumber(
  type: "private" | "company",
  value: FormDataEntryValue | null,
): { value: string | null } | { error: string } {
  if (type !== "company") return { value: null };
  const raw = String(value ?? "").trim();
  if (!raw) return { error: "Organisationsnummer krävs för företag." };
  const digits = raw.replace(/\D/g, "");
  const normalized =
    digits.length === 12 ? `${digits.slice(0, 8)}-${digits.slice(8)}` : raw;
  if (!ORG_NUMBER_RE.test(normalized)) {
    return {
      error:
        "Ogiltigt organisationsnummer. Format: NNNNNNNN-NNNN (8 siffror, bindestreck, 4 siffror).",
    };
  }
  return { value: normalized };
}

/** Hjälpare: tolkar en checkbox/flagga från FormData som boolean. */
function bool(value: FormDataEntryValue | null): boolean {
  const s = String(value ?? "");
  return s === "on" || s === "true" || s === "1";
}

/** Hjälpare: trimmar och gör tomma strängar till null. */
function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}
