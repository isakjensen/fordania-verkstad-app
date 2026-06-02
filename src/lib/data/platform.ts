import "server-only";
import { db } from "@/lib/db";

/** Initialer från ett företags-/personnamn, t.ex. "Eriks Biluthyrning" → "EB". */
export function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export interface TenantRow {
  id: string;
  name: string;
  initials: string;
  slug: string;
  city: string | null;
  plan: string;
  status: string;
  users: number;
  vehicles: number;
  createdAt: Date;
}

/** Alla tenants (organizations) med antal användare och fordon. */
export async function getTenants(limit?: number): Promise<TenantRow[]> {
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { _count: { select: { members: true, vehicles: true } } },
  });
  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    initials: initialsFromName(o.name),
    slug: o.slug,
    city: o.city,
    plan: o.plan,
    status: o.status,
    users: o._count.members,
    vehicles: o._count.vehicles,
    createdAt: o.createdAt,
  }));
}

export interface PlatformUserRow {
  id: string;
  memberId: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  tenantName: string;
  status: string;
}

/** Alla användare över alla tenants (via medlemskap). */
export async function getPlatformUsers(): Promise<PlatformUserRow[]> {
  const members = await db.member.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, organization: true },
  });
  return members.map((m) => ({
    id: m.user.id,
    memberId: m.id,
    name: m.user.name,
    email: m.user.email,
    initials: initialsFromName(m.user.name),
    role: m.role,
    tenantName: m.organization.name,
    status: m.user.banned ? "inactive" : "active",
  }));
}
