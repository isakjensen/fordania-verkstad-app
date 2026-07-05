import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getActiveOrganizationId, getSession } from "@/lib/session";
import { getWorkOrders, getRemovedWorkOrders } from "@/lib/data/work-orders";
import { getMechanics } from "@/lib/data/schedule";
import { getVehicleOptions } from "@/lib/data/vehicles";
import { CreateWorkOrderButton } from "./create-work-order-button";
import { RemovedWorkOrdersButton } from "./removed-work-orders-button";
import { OrdersView } from "./orders-view";

export const metadata: Metadata = { title: "Arbetsordrar" };

export default async function ArbetsordrarPage() {
  const organizationId = await getActiveOrganizationId();
  const [session, orders, removedOrders, mechanics, vehicles] = organizationId
    ? await Promise.all([
        getSession(),
        getWorkOrders(organizationId),
        getRemovedWorkOrders(organizationId),
        getMechanics(organizationId),
        getVehicleOptions(organizationId),
      ])
    : [null, [], [], [], []];

  const userId = session?.user.id ?? null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col px-4 py-5 sm:px-6 lg:px-8">
      {!organizationId ? (
        <Card>
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Välj en verkstad för att se dess arbetsordrar.
          </p>
        </Card>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <OrdersView
            orders={orders}
            userId={userId}
            createButton={
              <CreateWorkOrderButton mechanics={mechanics} vehicles={vehicles} />
            }
            removedButton={<RemovedWorkOrdersButton removed={removedOrders} />}
          />
        </Card>
      )}
    </div>
  );
}
