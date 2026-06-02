"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  requireUser,
  getActiveOrganizationId,
  getTenantRole,
  canManageUsers,
} from "@/lib/session";

export type ActionResult = { success: true } | { error: string };

const NO_ORG =
  "Du tillhör ingen verkstad – logga in som en verkstadsanvändare.";
const NO_PERMISSION =
  "Du har inte behörighet att hantera användare i den här verkstaden.";

const VALID_ROLES = ["admin", "member"];

/**
 * Säkerställer att den inloggade får hantera användare i sin aktiva tenant.
 * Returnerar tenantens id, annars ett fel.
 */
async function requireManager(): Promise<
  { organizationId: string } | { error: string }
> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };

  const role = await getTenantRole(organizationId);
  if (!canManageUsers(role)) return { error: NO_PERMISSION };
  return { organizationId };
}

/** Hämtar en medlem och säkerställer att den tillhör tenanten. */
async function memberInTenant(memberId: string, organizationId: string) {
  return db.member.findFirst({
    where: { id: memberId, organizationId },
    include: { user: true },
  });
}

/** Verkstads-admin skapar en ny användare i sin egen verkstad. */
export async function createTenantUser(
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireManager();
  if ("error" in guard) return guard;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "member");

  if (!name || !email || !password) {
    return { error: "Namn, e-post och lösenord krävs." };
  }
  if (password.length < 8) {
    return { error: "Lösenordet måste vara minst 8 tecken." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Finns kontot redan? Koppla det till verkstaden om det inte redan är med.
    const already = await db.member.findFirst({
      where: { userId: existing.id, organizationId: guard.organizationId },
    });
    if (already) {
      return { error: "Användaren finns redan i verkstaden." };
    }
    await db.member.create({
      data: {
        id: randomUUID(),
        organizationId: guard.organizationId,
        userId: existing.id,
        role: VALID_ROLES.includes(role) ? role : "member",
        createdAt: new Date(),
      },
    });
    revalidatePath("/anvandare");
    return { success: true };
  }

  // Skapa kontot direkt (tenant-admin saknar globala admin-rättigheter som
  // auth.api.createUser kräver). Lösenordet hashas med Better Auths egen hash.
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const userId = randomUUID();

  await db.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: true,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await db.account.create({
    data: {
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await db.member.create({
    data: {
      id: randomUUID(),
      organizationId: guard.organizationId,
      userId,
      role: VALID_ROLES.includes(role) ? role : "member",
      createdAt: new Date(),
    },
  });

  revalidatePath("/anvandare");
  return { success: true };
}

/** Uppdaterar namn, roll och aktiv/inaktiv för en användare i verkstaden. */
export async function updateTenantUser(
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireManager();
  if ("error" in guard) return guard;

  const memberId = String(formData.get("memberId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const active = String(formData.get("active") ?? "true") === "true";

  if (!memberId) return { error: "Medlems-id saknas." };
  if (!name) return { error: "Namn krävs." };

  const member = await memberInTenant(memberId, guard.organizationId);
  if (!member) return { error: "Användaren hittades inte." };

  // Superadmin-konton rör vi inte härifrån.
  if (member.user.role === "admin") {
    return { error: "Superadmin-konton hanteras i superadmin-vyn." };
  }

  await db.user.update({
    where: { id: member.userId },
    data: {
      name,
      banned: !active,
      ...(active ? { banReason: null, banExpires: null } : {}),
    },
  });

  await db.member.update({
    where: { id: memberId },
    data: { role: VALID_ROLES.includes(role) ? role : member.role },
  });

  revalidatePath("/anvandare");
  return { success: true };
}

/** Sätter ett nytt lösenord för en användare i verkstaden. */
export async function setTenantUserPassword(
  memberId: string,
  newPassword: string,
): Promise<ActionResult> {
  const guard = await requireManager();
  if ("error" in guard) return guard;

  if (!memberId) return { error: "Medlems-id saknas." };
  if (!newPassword || newPassword.length < 8) {
    return { error: "Lösenordet måste vara minst 8 tecken." };
  }

  const member = await memberInTenant(memberId, guard.organizationId);
  if (!member) return { error: "Användaren hittades inte." };
  if (member.user.role === "admin") {
    return { error: "Superadmin-konton hanteras i superadmin-vyn." };
  }

  // Hasha lösenordet med Better Auths egen hash och uppdatera kontot.
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(newPassword);

  const updated = await db.account.updateMany({
    where: { userId: member.userId, providerId: "credential" },
    data: { password: hash },
  });

  // Saknar användaren ett lösenordskonto skapar vi ett.
  if (updated.count === 0) {
    await db.account.create({
      data: {
        id: randomUUID(),
        accountId: member.userId,
        providerId: "credential",
        userId: member.userId,
        password: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  revalidatePath("/anvandare");
  return { success: true };
}

/** Tar bort en användare från verkstaden (raderar medlemskapet). */
export async function removeTenantUser(
  memberId: string,
): Promise<ActionResult> {
  const guard = await requireManager();
  if ("error" in guard) return guard;

  if (!memberId) return { error: "Medlems-id saknas." };

  const member = await memberInTenant(memberId, guard.organizationId);
  if (!member) return { error: "Användaren hittades inte." };
  if (member.user.role === "admin") {
    return { error: "Superadmin-konton kan inte tas bort härifrån." };
  }

  await db.member.delete({ where: { id: memberId } });

  // Städa bort konton som inte längre tillhör någon verkstad.
  const remaining = await db.member.count({ where: { userId: member.userId } });
  if (remaining === 0) {
    await db.user.delete({ where: { id: member.userId } });
  }

  revalidatePath("/anvandare");
  return { success: true };
}
