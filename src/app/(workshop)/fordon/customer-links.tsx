"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus, X, Loader2, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { FieldSelect } from "@/components/ui/field-select";
import { linkVehicle, unlinkVehicle } from "../kunder/actions";

interface LinkedCustomer {
  id: string;
  name: string;
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function CustomerLinks({
  vehicleId,
  customers,
  options,
}: {
  vehicleId: string;
  customers: LinkedCustomer[];
  options: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  const linkedIds = new Set(customers.map((c) => c.id));
  const available = options.filter((o) => !linkedIds.has(o.id));

  function add() {
    if (!selected) return;
    setError("");
    setBusyId("add");
    startTransition(async () => {
      const res = await linkVehicle(selected, vehicleId);
      if ("error" in res) setError(res.error);
      else setSelected("");
      setBusyId(null);
      router.refresh();
    });
  }

  function remove(customerId: string) {
    setError("");
    setBusyId(customerId);
    startTransition(async () => {
      const res = await unlinkVehicle(customerId, vehicleId);
      if ("error" in res) setError(res.error);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Kunder"
        subtitle={`${customers.length} kopplade kunder`}
      />
      <CardBody className="space-y-4">
        {customers.length > 0 ? (
          <ul className="divide-y divide-line">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <Avatar initials={initialsOf(c.name)} size="size-9 text-xs" />
                <Link
                  href={`/kunder/${c.id}`}
                  className="flex-1 truncate text-sm font-medium text-ink hover:text-brand-600"
                >
                  {c.name}
                </Link>
                <Link
                  href={`/kunder/${c.id}`}
                  className="text-muted-foreground transition-colors hover:text-ink"
                  aria-label={`Öppna ${c.name}`}
                >
                  <ChevronRight className="size-4" />
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Koppla bort ${c.name}`}
                  disabled={pending}
                  onClick={() => remove(c.id)}
                >
                  {busyId === c.id ? (
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
            <Users className="size-4" />
            Inga kunder kopplade till fordonet ännu.
          </p>
        )}

        {available.length > 0 ? (
          <div className="flex gap-2 border-t border-line pt-3">
            <FieldSelect
              size="sm"
              className="flex-1"
              placeholder="Välj kund att koppla…"
              value={selected}
              onValueChange={setSelected}
              options={available.map((o) => ({ value: o.id, label: o.name }))}
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
