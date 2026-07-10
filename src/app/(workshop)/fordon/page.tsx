import type { Metadata } from "next";
import { Car } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import {
  getActiveOrganizationId,
  getTenantRole,
  canManageUsers,
} from "@/lib/session";
import {
  getVehicles,
  getRemovedVehicles,
  getFieldDefinitions,
} from "@/lib/data/vehicles";
import { CreateVehicleButton } from "./create-vehicle-button";
import { SyncFordaniaButton } from "./sync-fordania-button";
import { RemovedVehiclesButton } from "./removed-vehicles-button";
import { VehiclesView } from "./vehicles-view";

export const metadata: Metadata = { title: "Fordon" };

export default async function VehiclesPage() {
  const organizationId = await getActiveOrganizationId();
  const [vehicles, removedVehicles, fieldDefinitions, role] = organizationId
    ? await Promise.all([
        getVehicles(organizationId),
        getRemovedVehicles(organizationId),
        getFieldDefinitions(organizationId),
        getTenantRole(organizationId),
      ])
    : [[], [], [], null];

  const isAdmin = canManageUsers(role);

  const syncButton = isAdmin ? <SyncFordaniaButton /> : null;
  const removedButton = <RemovedVehiclesButton removed={removedVehicles} />;
  const createButton = <CreateVehicleButton fieldDefinitions={fieldDefinitions} />;

  // Samlad knapprad för tomt-läget (CardHeader) – enkel rad räcker där.
  const action = organizationId ? (
    <div className="flex items-center gap-2">
      {syncButton}
      {removedButton}
      {createButton}
    </div>
  ) : null;

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <Card>
        {!organizationId ? (
          <>
            <CardHeader title="Fordon" />
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Välj en verkstad för att se dess fordon.
            </p>
          </>
        ) : vehicles.length === 0 ? (
          <>
            <CardHeader
              title="Fordon"
              subtitle="0 fordon i registret"
              action={action}
            />
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Car className="size-6" />
              </span>
              <p className="mt-4 font-semibold text-ink">Inga fordon ännu</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Klicka på &quot;Lägg till fordon&quot; för att registrera ditt
                första fordon.
              </p>
            </div>
          </>
        ) : (
          <VehiclesView
            vehicles={vehicles}
            syncButton={syncButton}
            removedButton={removedButton}
            createButton={createButton}
          />
        )}
      </Card>
    </div>
  );
}
