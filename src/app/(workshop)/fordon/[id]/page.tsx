import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { LicensePlate } from "@/components/ui/license-plate";
import { BackButton } from "@/components/ui/back-button";
import { getActiveOrganizationId } from "@/lib/session";
import { getVehicle, getFieldDefinitions } from "@/lib/data/vehicles";
import { getCustomerOptions } from "@/lib/data/customers";
import { OdometerSection } from "../odometer-section";
import { VehicleActions } from "../vehicle-actions";
import { CustomerLinks } from "../customer-links";

export const metadata: Metadata = { title: "Fordon" };

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) notFound();

  const [vehicle, fieldDefinitions, customerOptions] = await Promise.all([
    getVehicle(id, organizationId),
    getFieldDefinitions(organizationId),
    getCustomerOptions(organizationId),
  ]);
  if (!vehicle) notFound();

  const linkedCustomers = vehicle.customers.map((cv) => ({
    id: cv.customer.id,
    name: cv.customer.name,
  }));

  const valueByDef = new Map(
    vehicle.fieldValues.map((fv) => [fv.definitionId, fv.value]),
  );

  // Fält + nuvarande värde, för både visning och redigering
  const fields = fieldDefinitions.map((d) => ({
    id: d.id,
    label: d.label,
    type: d.type,
    value: valueByDef.get(d.id) ?? "",
  }));

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
      <BackButton fallbackHref="/fordon" />

      <div className="mt-4 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <LicensePlate value={vehicle.regNo} className="h-9" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              {vehicle.regNo}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
                (vehicle.chassisNumber
                  ? `Chassinr ${vehicle.chassisNumber}`
                  : "Märke/modell saknas")}
            </p>
          </div>
        </div>
        <VehicleActions
          vehicle={{
            id: vehicle.id,
            regNo: vehicle.regNo,
            chassisNumber: vehicle.chassisNumber,
            brand: vehicle.brand,
            model: vehicle.model,
          }}
          fields={fields}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Uppgifter */}
        <Card className="lg:col-span-2">
          <CardHeader tone="brand" title="Uppgifter" />
          <CardBody className="divide-y divide-line py-0">
            <Row label="Registreringsnummer" value={vehicle.regNo} />
            <Row label="Märke" value={vehicle.brand ?? "—"} />
            <Row label="Modell" value={vehicle.model ?? "—"} />
            <Row label="Chassinummer" value={vehicle.chassisNumber ?? "—"} />
            {fields.length === 0 ? (
              <p className="py-3 text-xs text-muted-foreground">
                Inga egna fält definierade. En verkstadsadmin lägger till fält
                under Inställningar.
              </p>
            ) : (
              fields.map((f) => (
                <Row key={f.id} label={f.label} value={f.value || "—"} />
              ))
            )}
          </CardBody>
        </Card>

        {/* Mätarställning + kopplade kunder */}
        <div className="space-y-6 lg:col-span-3">
          <OdometerSection
            vehicleId={vehicle.id}
            readings={vehicle.odometer}
          />
          <CustomerLinks
            vehicleId={vehicle.id}
            customers={linkedCustomers}
            options={customerOptions}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
