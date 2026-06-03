import "server-only";
import { db } from "@/lib/db";

/**
 * Alla arbetsordrar för en tenant, med mekaniker, fordon och delar (för
 * summering). Scopas alltid på organizationId.
 */
export async function getWorkOrders(organizationId: string) {
  return db.job.findMany({
    where: { organizationId },
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

export type WorkOrderListItem = Awaited<
  ReturnType<typeof getWorkOrders>
>[number];
