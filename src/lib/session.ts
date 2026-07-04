import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";

/**
 * Hämtar aktuell session (eller null) i en server-komponent/action.
 *
 * Wrappad i Reacts `cache()` så att alla anrop under samma request delar
 * EN sessionsvalidering. Utan detta hämtar t.ex. inställningssidan sessionen
 * 3–4 gånger (getSession + getActiveOrganizationId + getTenantRole + audit),
 * vilket med en molndatabas betyder lika många onödiga nätverkstur-och-retur.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Returnerar den aktiva tenantens (organizationens) id för inloggad användare.
 * Använder sessionens activeOrganizationId om satt, annars användarens första
 * medlemskap. Null om användaren inte tillhör någon tenant.
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  // Ett uttryckligt val på sessionen vinner alltid
  const active = session.session.activeOrganizationId;
  if (active) return active;

  // Vanliga användare: deras första (tidigaste) medlemskap
  const member = await db.member.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  if (member) return member.organizationId;

  // Superadmin tillhör ingen verkstad men får agera i alla – välj den första
  if (session.user.role === "admin") {
    const firstOrg = await db.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });
    return firstOrg?.id ?? null;
  }

  return null;
}

/** Kräver inloggad användare med en aktiv tenant, annars redirect. */
export async function requireActiveOrganizationId(): Promise<string> {
  const orgId = await getActiveOrganizationId();
  if (!orgId) redirect("/login");
  return orgId;
}

/** Kräver inloggad användare, annars redirect till /login. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Kräver global superadmin (User.role = "admin"), annars redirect. */
export async function requireSuperadmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/");
  return session;
}

/** True om användaren är global superadmin. */
export function isSuperadmin(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user.role === "admin";
}

/**
 * Användarens roll i en specifik tenant: "superadmin" (global admin, får allt),
 * tenantens member-roll ("admin"/"member"), eller null om utanför.
 */
export async function getTenantRole(
  organizationId: string,
): Promise<"superadmin" | "admin" | "member" | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.user.role === "admin") return "superadmin";

  const member = await db.member.findFirst({
    where: { userId: session.user.id, organizationId },
  });
  // Äldre konton kan ha rollen "owner" – behandla den som "admin".
  if (member?.role === "owner") return "admin";
  return (member?.role as "admin" | "member" | undefined) ?? null;
}

/** True om rollen får hantera tenantens användare (admin/superadmin). */
export function canManageUsers(
  role: Awaited<ReturnType<typeof getTenantRole>>,
) {
  return role === "superadmin" || role === "admin";
}
