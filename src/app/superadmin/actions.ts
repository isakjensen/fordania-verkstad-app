"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireSuperadmin } from "@/lib/session";

export type ActionResult = { success: true } | { error: string };

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
  const plan = String(formData.get("plan") ?? "Bas").trim();

  if (!name) return { error: "Företagsnamn krävs." };

  let slug = slugify(name);
  if (!slug) slug = randomUUID().slice(0, 8);

  const existing = await db.organization.findUnique({ where: { slug } });
  if (existing) {
    return { error: "Ett företag med liknande namn finns redan." };
  }

  await db.organization.create({
    data: {
      id: randomUUID(),
      name,
      slug,
      city: city || null,
      plan: ["Bas", "Plus", "Enterprise"].includes(plan) ? plan : "Bas",
      status: "active",
      createdAt: new Date(),
    },
  });

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/tenants");
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

  await db.member.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      userId: created.user.id,
      role: ["owner", "admin", "member"].includes(role) ? role : "member",
      createdAt: new Date(),
    },
  });

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/anvandare");
  return { success: true };
}
