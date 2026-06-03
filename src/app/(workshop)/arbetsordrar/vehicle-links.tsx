"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Plus, X, Loader2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LicensePlate } from "@/components/ui/license-plate";
import { FieldSelect } from "@/components/ui/field-select";
import { linkVehicle, unlinkVehicle } from "./actions";

interface LinkedVehicle {
  id: string;
  regNo: string;
  brand: string | null;
  model: string | null;
}

export function VehicleLinks({
  jobId,
  vehicles,
  options,
}: {
  jobId: string;
  vehicles: LinkedVehicle[];
  options: { id: string; regNo: string; chassisNumber: string | null }[];
}) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  const linkedIds = new Set(vehicles.map((v) => v.id));
  const available = options.filter((o) => !linkedIds.has(o.id));

  function add() {
    if (!selected) return;
    setError("");
    setBusyId("add");
    startTransition(async () => {
      const res = await linkVehicle(jobId, selected);
      if ("error" in res) setError(res.error);
      else setSelected("");
      setBusyId(null);
      router.refresh();
    });
  }

  function remove(vehicleId: string) {
    setError("");
    setBusyId(vehicleId);
    startTransition(async () => {
      const res = await unlinkVehicle(jobId, vehicleId);
      if ("error" in res) setError(res.error);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Fordon"
        subtitle={`${vehicles.length} kopplade`}
      />
      <CardBody className="space-y-4">
        {vehicles.length > 0 ? (
          <ul className="divide-y divide-line">
            {vehicles.map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-2.5">
                <Link href={`/fordon/${v.id}`} className="inline-flex shrink-0">
                  <LicensePlate value={v.regNo} className="shrink-0" />
                </Link>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                  {[v.brand, v.model].filter(Boolean).join(" ")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Ta bort ${v.regNo}`}
                  disabled={pending}
                  onClick={() => remove(v.id)}
                >
                  {busyId === v.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4 text-danger" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-surface-muted/50 px-3 py-4 text-sm text-muted-foreground">
            <Car className="size-4" />
            Inga fordon kopplade ännu.
          </p>
        )}

        {available.length > 0 ? (
          <div className="flex gap-2 border-t border-line pt-3">
            <FieldSelect
              className="flex-1"
              placeholder="Välj fordon…"
              value={selected}
              onValueChange={setSelected}
              options={available.map((o) => ({
                value: o.id,
                label: o.chassisNumber
                  ? `${o.regNo} · ${o.chassisNumber}`
                  : o.regNo,
              }))}
            />
            <Button type="button" onClick={add} disabled={pending || !selected}>
              {busyId === "add" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Koppla
            </Button>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
