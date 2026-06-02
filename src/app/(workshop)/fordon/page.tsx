import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Car, Gauge } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { LicensePlate } from "@/components/ui/license-plate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActiveOrganizationId } from "@/lib/session";
import { getVehicles, getFieldDefinitions } from "@/lib/data/vehicles";
import { CreateVehicleButton } from "./create-vehicle-button";

export const metadata: Metadata = { title: "Fordon" };

const nf = new Intl.NumberFormat("sv-SE");

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

export default async function VehiclesPage() {
  const organizationId = await getActiveOrganizationId();
  const [vehicles, fieldDefinitions] = organizationId
    ? await Promise.all([
        getVehicles(organizationId),
        getFieldDefinitions(organizationId),
      ])
    : [[], []];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Register
          </p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]">
            Fordon
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fordonsregister – registreringsnummer, uppgifter och
            mätarställningar.
          </p>
        </div>
        {organizationId ? (
          <CreateVehicleButton fieldDefinitions={fieldDefinitions} />
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader
          tone="brand"
          title="Alla fordon"
          subtitle={`${vehicles.length} fordon i registret`}
        />

        {!organizationId ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Välj en verkstad för att se dess fordon.
          </p>
        ) : vehicles.length === 0 ? (
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
                <TableHead className={`${headClass} min-w-[160px]`}>
                  Reg.nr
                </TableHead>
                <TableHead className={`${headClass}`}>Fordon</TableHead>
                <TableHead className={`${headClass} hidden lg:table-cell`}>
                  Chassinummer
                </TableHead>
                <TableHead
                  className={`${headClass} hidden text-right sm:table-cell`}
                >
                  Mätarställning
                </TableHead>
                <TableHead className={`${headClass} w-12`} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => {
                const latest = v.odometer[0];
                return (
                  <TableRow key={v.id} className="group">
                    <TableCell className="px-4 py-3">
                      <Link href={`/fordon/${v.id}`} className="inline-flex">
                        <LicensePlate value={v.regNo} />
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {v.brand || v.model ? (
                        <span className="text-sm font-medium text-ink">
                          {[v.brand, v.model].filter(Boolean).join(" ")}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-ink-soft tabular-nums lg:table-cell">
                      {v.chassisNumber ?? "—"}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-right sm:table-cell">
                      {latest ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink tabular-nums">
                          <Gauge className="size-3.5 text-muted-foreground" />
                          {nf.format(latest.value)} km
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Link
                        href={`/fordon/${v.id}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-ink"
                        aria-label={`Öppna ${v.regNo}`}
                      >
                        <ChevronRight className="size-5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
