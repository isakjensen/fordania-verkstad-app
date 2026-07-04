"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireSuperadmin } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export type ActionResult = { success: true } | { error: string };

const VALID_STATUSES = ["active", "trial", "paused", "invited"];

/** Gör om ett namn till en URL-vänlig slug (hanterar å/ä/ö). */
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[àáâã]/g, "a")
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Superadmin skapar en ny tenant (organization). */
export async function createTenant(formData: FormData): Promise<ActionResult> {
  await requireSuperadmin();

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!name) return { error: "Företagsnamn krävs." };

  let slug = slugify(name);
  if (!slug) slug = randomUUID().slice(0, 8);

  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) {
    return { error: "Ett företag med liknande namn finns redan." };
  }

  const orgId = randomUUID();
  await db.organization.create({
    data: {
      id: orgId,
      name,
      slug,
      city: city || null,
      status: "active",
      createdAt: new Date(),
    },
  });

  await recordAudit({
    action: "tenant.create",
    category: "tenant",
    summary: `Skapade företaget ${name}`,
    organizationId: orgId,
    entityType: "organization",
    entityId: orgId,
  });

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/foretag");
  return { success: true };
}

/** Superadmin redigerar ett företags namn, stad och status. */
export async function updateTenant(formData: FormData): Promise<ActionResult> {
  await requireSuperadmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id) return { error: "Företags-id saknas." };
  if (!name) return { error: "Företagsnamn krävs." };

  const org = await db.organization.findUnique({ where: { id } });
  if (!org) return { error: "Företaget hittades inte." };

  const nextStatus = VALID_STATUSES.includes(status) ? status : org.status;
  await db.organization.update({
    where: { id },
    data: {
      name,
      city: city || null,
      status: nextStatus,
    },
  });

  await recordAudit({
    action: "tenant.update",
    category: "tenant",
    summary:
      nextStatus !== org.status
        ? `Ändrade företaget ${name} (status → ${nextStatus})`
        : `Uppdaterade företaget ${name}`,
    organizationId: id,
    entityType: "organization",
    entityId: id,
  });

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/foretag");
  revalidatePath("/superadmin/anvandare");
  return { success: true };
}

/**
 * Superadmin tar bort ett företag. Tack vare onDelete: Cascade försvinner
 * även medlemskap, fordon, mekaniker och jobb. Globala användarkonton (User)
 * ligger kvar eftersom de kan tillhöra flera företag.
 */
export async function deleteTenant(id: string): Promise<ActionResult> {
  await requireSuperadmin();

  if (!id) return { error: "Företags-id saknas." };

  const org = await db.organization.findUnique({ where: { id } });
  if (!org) return { error: "Företaget hittades inte." };

  await db.organization.delete({ where: { id } });

  await recordAudit({
    action: "tenant.delete",
    category: "tenant",
    summary: `Tog bort företaget ${org.name}`,
    organizationId: id,
    entityType: "organization",
    entityId: id,
  });

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/foretag");
  revalidatePath("/superadmin/anvandare");
  return { success: true };
}

/** Superadmin skapar en användare och kopplar den till en tenant med en roll. */
export async function createUserInTenant(
  formData: FormData,
): Promise<ActionResult> {
  await requireSuperadmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  const role = String(formData.get("role") ?? "member");

  if (!name || !email || !password) {
    return { error: "Namn, e-post och lösenord krävs." };
  }
  if (password.length < 8) {
    return { error: "Lösenordet måste vara minst 8 tecken." };
  }
  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) return { error: "Tenanten hittades inte." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "En användare med den e-posten finns redan." };

  // Skapa användaren via Better Auth (hashar lösenordet korrekt)
  const created = await auth.api.createUser({
    body: { name, email, password, role: "user" },
    headers: await headers(),
  });

  const memberRole = ["admin", "member"].includes(role) ? role : "member";
  await db.member.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      userId: created.user.id,
      role: memberRole,
      createdAt: new Date(),
    },
  });

  await recordAudit({
    action: "user.create",
    category: "user",
    summary: `Skapade användaren ${name} (${email}) i ${org.name} som ${memberRole}`,
    organizationId: org.id,
    entityType: "user",
    entityId: created.user.id,
  });

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/foretag");
  revalidatePath("/superadmin/anvandare");
  return { success: true };
}

const VALID_MEMBER_ROLES = ["admin", "member"];

/**
 * Superadmin redigerar en användare: namn, roll i företaget och aktiv/inaktiv
 * (inaktiv = bannad i Better Auth, kan inte logga in).
 */
export async function updateUser(formData: FormData): Promise<ActionResult> {
  await requireSuperadmin();

  const memberId = String(formData.get("memberId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!memberId) return { error: "Medlems-id saknas." };
  if (!name) return { error: "Namn krävs." };

  const member = await db.member.findUnique({ where: { id: memberId } });
  if (!member) return { error: "Användaren hittades inte." };

  await db.user.update({
    where: { id: member.userId },
    data: {
      name,
      banned: status === "inactive",
      ...(status === "inactive" ? {} : { banReason: null, banExpires: null }),
    },
  });

  await db.member.update({
    where: { id: memberId },
    data: {
      role: VALID_MEMBER_ROLES.includes(role) ? role : member.role,
    },
  });

  await recordAudit({
    action: "user.update",
    category: "user",
    summary:
      status === "inactive"
        ? `Inaktiverade användaren ${name}`
        : `Uppdaterade användaren ${name}`,
    organizationId: member.organizationId,
    entityType: "user",
    entityId: member.userId,
  });

  revalidatePath("/superadmin/anvandare");
  return { success: true };
}

/**
 * Superadmin tar bort en användare från ett företag (raderar medlemskapet).
 * Om det var användarens enda medlemskap – och den inte är superadmin –
 * raderas även det globala kontot så att inga föräldralösa konton lämnas kvar.
 */
export async function removeUserFromTenant(
  memberId: string,
): Promise<ActionResult> {
  await requireSuperadmin();

  if (!memberId) return { error: "Medlems-id saknas." };

  const member = await db.member.findUnique({
    where: { id: memberId },
    include: { user: true },
  });
  if (!member) return { error: "Användaren hittades inte." };

  await db.member.delete({ where: { id: memberId } });

  // Städa bort föräldralösa konton (men aldrig superadmins).
  const remaining = await db.member.count({ where: { userId: member.userId } });
  const accountDeleted = remaining === 0 && member.user.role !== "admin";
  if (accountDeleted) {
    await db.user.delete({ where: { id: member.userId } });
  }

  await recordAudit({
    action: accountDeleted ? "user.delete" : "user.remove",
    category: "user",
    summary: accountDeleted
      ? `Tog bort användaren ${member.user.name} (${member.user.email})`
      : `Tog bort ${member.user.name} från företaget`,
    organizationId: member.organizationId,
    entityType: "user",
    entityId: member.userId,
  });

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/foretag");
  revalidatePath("/superadmin/anvandare");
  return { success: true };
}
