import "server-only";
import { db } from "@/lib/db";

/**
 * Alla arbetsordrar för en tenant, med mekaniker, fordon och delar (för
 * summering). Scopas alltid på organizationId.
 */
export async function getWorkOrders(organizationId: string) {
  return db.job.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      mechanics: { include: { user: { select: { id: true, name: true } } } },
      vehicles: {
        include: {
          vehicle: { select: { id: true, regNo: true, brand: true, model: true } },
        },
      },
      parts: {
        select: { quantity: true, unitPriceExclOre: true, vatRate: true },
      },
    },
  });
}

/**
 * Borttagna (mjukraderade) arbetsordrar för en tenant, nyast borttagna först.
 * Används i "Borttagna arbetsordrar"-dialogen för att kunna återställa dem.
 */
export async function getRemovedWorkOrders(organizationId: string) {
  return db.job.findMany({
    where: { organizationId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      deletedAt: true,
      vehicles: {
        select: { vehicle: { select: { regNo: true } } },
      },
    },
  });
}

export type WorkOrderListItem = Awaited<
  ReturnType<typeof getWorkOrders>
>[number];

export type RemovedWorkOrder = Awaited<
  ReturnType<typeof getRemovedWorkOrders>
>[number];
