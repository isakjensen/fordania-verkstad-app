import type { Metadata } from "next";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { getActiveOrganizationId } from "@/lib/session";
import { getFieldDefinitions } from "@/lib/data/vehicles";
import { VehicleFieldsManager } from "./vehicle-fields-manager";

export const metadata: Metadata = { title: "Inställningar" };

export default async function SettingsPage() {
  const organizationId = await getActiveOrganizationId();
  const fields = organizationId
    ? await getFieldDefinitions(organizationId)
    : [];

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="border-b border-line pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Verkstad
        </p>
        <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]">
          Inställningar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anpassa hur verkstadens register fungerar.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader
          tone="brand"
          title="Fordonsfält"
          subtitle="Definiera vilka uppgifter ni vill registrera på era fordon. Registreringsnummer och chassinummer finns alltid."
        />
        <CardBody className="pt-5">
          {!organizationId ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Välj en verkstad för att hantera dess fordonsfält.
            </p>
          ) : (
            <VehicleFieldsManager fields={fields} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
