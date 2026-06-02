"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Gauge, Plus, Loader2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { addOdometerReading } from "./actions";

interface Reading {
  id: string;
  value: number;
  readingDate: Date;
}

const nf = new Intl.NumberFormat("sv-SE");
const dtf = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function OdometerSection({
  vehicleId,
  readings,
}: {
  vehicleId: string;
  readings: Reading[];
}) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const latest = readings[0];

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.set("vehicleId", vehicleId);
    formData.set("value", value);
    if (date) formData.set("readingDate", date);
    startTransition(async () => {
      const res = await addOdometerReading(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setValue("");
      setDate("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Mätarställning"
        subtitle={
          latest
            ? `Senast uppdaterad ${dtf.format(new Date(latest.readingDate))}`
            : "Ingen avläsning ännu"
        }
      />
      <CardBody className="space-y-4">
        {/* Senaste värdet */}
        <div className="flex items-end gap-2 rounded-xl bg-surface-muted p-4">
          <Gauge className="mb-1 size-6 text-brand-600" />
          <span className="text-[2.25rem] font-bold leading-none text-ink tabular-nums">
            {latest ? nf.format(latest.value) : "—"}
          </span>
          <span className="mb-1 text-sm font-medium text-muted-foreground">
            km
          </span>
        </div>

        {/* Uppdatera */}
        <form
          onSubmit={submit}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="odo-value">Ny mätarställning (km)</Label>
            <Input
              id="odo-value"
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="t.ex. 12500"
              className="h-8"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="odo-date">Datum</Label>
            <DatePicker
              id="odo-date"
              value={date}
              onChange={setDate}
              placeholder="Idag"
              disableFuture
              size="sm"
            />
          </div>
          <Button type="submit" disabled={pending || !value}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Spara
          </Button>
        </form>

        {error ? (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        {/* Historik */}
        {readings.length > 0 ? (
          <div className="border-t border-line pt-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Historik
            </p>
            <ul className="divide-y divide-line">
              {readings.map((r, i) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-ink tabular-nums">
                    {nf.format(r.value)} km
                    {i === 0 ? (
                      <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-success">
                        Senaste
                      </span>
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {dtf.format(new Date(r.readingDate))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
