"use server";

import { db } from "@/lib/db";
import { requireUser, getActiveOrganizationId } from "@/lib/session";
import type { SearchHit } from "@/lib/search-types";

/**
 * Global sök för toppbaren. Söker tenant-scopat i fordon, kunder och
 * arbetsordrar och returnerar de bästa träffarna grupperat. Allt filtreras
 * alltid på aktiv organisation så en verkstad aldrig ser en annans data.
 */
export async function globalSearch(query: string): Promise<SearchHit[]> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  const q = query.trim();
  if (!organizationId || q.length < 2) return [];

  const contains = { contains: q, mode: "insensitive" as const };

  const [vehicles, customers, jobs] = await Promise.all([
    db.vehicle.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { regNo: contains },
          { brand: contains },
          { model: contains },
          { chassisNumber: contains },
        ],
      },
      orderBy: { regNo: "asc" },
      take: 5,
      select: { id: true, regNo: true, brand: true, model: true },
    }),
    db.customer.findMany({
      where: {
        organizationId,
        OR: [
          { name: contains },
          { email: contains },
          { phone: contains },
          { personalNumber: contains },
        ],
      },
      orderBy: { name: "asc" },
      take: 5,
      select: { id: true, name: true, phone: true, email: true },
    }),
    db.job.findMany({
      where: {
        organizationId,
        OR: [
          { type: contains },
          { description: contains },
          { vehicle: { regNo: contains } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        vehicle: { select: { regNo: true } },
      },
    }),
  ]);

  return [
    ...vehicles.map((v) => ({
      id: v.id,
      group: "vehicle" as const,
      title: v.regNo,
      subtitle: [v.brand, v.model].filter(Boolean).join(" ") || "Fordon",
      href: `/fordon/${v.id}`,
    })),
    ...customers.map((c) => ({
      id: c.id,
      group: "customer" as const,
      title: c.name,
      subtitle: c.phone || c.email || "Kund",
      href: `/kunder/${c.id}`,
    })),
    ...jobs.map((j) => ({
      id: j.id,
      group: "job" as const,
      title: j.type,
      subtitle: j.vehicle?.regNo ?? "Arbetsorder",
      href: `/arbetsordrar/${j.id}`,
    })),
  ];
}
