import "server-only";
import { db } from "@/lib/db";
import { getSession, getActiveOrganizationId } from "@/lib/session";

export interface SwitcherTenant {
  id: string;
  name: string;
  city: string | null;
  initials: string;
}

export interface SwitcherData {
  tenants: SwitcherTenant[];
  activeId: string | null;
  isSuperadmin: boolean;
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Tenants som den inloggade användaren får agera i:
 * - Superadmin: alla verkstäder (de styr hela plattformen).
 * - Vanlig användare: de verkstäder hen är medlem i.
 */
export async function getSwitcherData(): Promise<SwitcherData> {
  const session = await getSession();
  if (!session) return { tenants: [], activeId: null, isSuperadmin: false };

  const isSuperadmin = session.user.role === "admin";

  const orgs = isSuperadmin
    ? await db.organization.findMany({ orderBy: { name: "asc" } })
    : (
        await db.member.findMany({
          where: { userId: session.user.id },
          include: { organization: true },
          orderBy: { createdAt: "asc" },
        })
      ).map((m) => m.organization);

  const activeId = await getActiveOrganizationId();

  return {
    isSuperadmin,
    activeId,
    tenants: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      city: o.city,
      initials: initialsOf(o.name),
    })),
  };
}
