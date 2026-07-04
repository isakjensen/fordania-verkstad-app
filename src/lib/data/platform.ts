import "server-only";
import { db } from "@/lib/db";
import { isOnline } from "@/lib/presence";

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
  tenantId: string;
  tenantName: string;
  status: string;
  /** Aktiv inom närvarofönstret just nu. */
  online: boolean;
  /** Senaste kända aktivitet (för "senast sedd"). */
  lastSeenAt: Date | null;
}

export interface PlatformStats {
  tenants: number;
  activeTenants: number;
  users: number;
  vehicles: number;
  jobs: number;
  byStatus: Record<string, number>;
}

/** Aggregerad plattformsöversikt – allt från riktiga DB-rader. */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [orgs, users, vehicles, jobs] = await Promise.all([
    db.organization.findMany({ select: { status: true } }),
    db.member.count(),
    db.vehicle.count(),
    db.job.count(),
  ]);
  const byStatus: Record<string, number> = {};
  for (const o of orgs) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  }
  return {
    tenants: orgs.length,
    activeTenants: byStatus["active"] ?? 0,
    users,
    vehicles,
    jobs,
    byStatus,
  };
}

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  isSuperadmin: boolean;
  online: boolean;
  lastSeenAt: Date | null;
  tenantName: string | null;
}

/**
 * Närvaro per person (distinkt användare) – vem är inne nu och när de senast
 * var aktiva. Online först, sedan nyast aktivitet.
 */
export async function getPresence(): Promise<PresenceUser[]> {
  const users = await db.user.findMany({
    where: { OR: [{ banned: false }, { banned: null }] },
    include: {
      members: {
        include: { organization: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  const list = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    initials: initialsFromName(u.name),
    isSuperadmin: u.role === "admin",
    online: isOnline(u.lastSeenAt),
    lastSeenAt: u.lastSeenAt,
    tenantName:
      u.members[0]?.organization.name ??
      (u.role === "admin" ? "Plattform" : null),
  }));

  list.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    const ta = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
    const tb = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
    return tb - ta;
  });

  return list;
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
    tenantId: m.organizationId,
    tenantName: m.organization.name,
    status: m.user.banned ? "inactive" : "active",
    online: !m.user.banned && isOnline(m.user.lastSeenAt),
    lastSeenAt: m.user.lastSeenAt,
  }));
}
