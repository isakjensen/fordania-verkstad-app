"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, X, Loader2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { FieldSelect } from "@/components/ui/field-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { formatOre, partTotals, laborLines, orderTotals } from "@/lib/pricing";
import { linkMechanic, unlinkMechanic, setMechanicLabor } from "./actions";

interface LinkedMechanic {
  /** = userId (mekanikern är en användare i verkstaden). */
  id: string;
  name: string;
  rateOre: number | null;
  hours: number | null;
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

/** Visar öre som ett enkelt kr-tal utan valutasymbol, t.ex. 65000 → "650". */
function oreToKrInput(ore: number | null): string {
  if (ore == null) return "";
  const kr = ore / 100;
  return Number.isInteger(kr) ? String(kr) : kr.toFixed(2).replace(".", ",");
}

export function MechanicLinks({
  jobId,
  mechanics,
  options,
}: {
  jobId: string;
  mechanics: LinkedMechanic[];
  options: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(
    null,
  );
  const router = useRouter();

  const linkedIds = new Set(mechanics.map((m) => m.id));
  const available = options.filter((o) => !linkedIds.has(o.id));

  // Total arbetskostnad (alla mekanikers timlön × timmar) inkl. moms.
  const laborTotal = orderTotals(
    laborLines(
      mechanics.map((m) => ({
        hours: m.hours,
        hourlyRateOreExcl: m.rateOre,
        vatRate: 25,
      })),
    ),
  );

  function add() {
    if (!selected) return;
    setError("");
    setBusyId("add");
    startTransition(async () => {
      const res = await linkMechanic(jobId, selected);
      if ("error" in res) setError(res.error);
      else setSelected("");
      setBusyId(null);
      router.refresh();
    });
  }

  function remove(userId: string) {
    setError("");
    setBusyId(userId);
    startTransition(async () => {
      const res = await unlinkMechanic(jobId, userId);
      if ("error" in res) setError(res.error);
      setBusyId(null);
      setConfirm(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Mekaniker"
        subtitle={`${mechanics.length} kopplade`}
      />
      <CardBody className="space-y-4">
        {mechanics.length > 0 ? (
          <ul className="divide-y divide-line">
            {mechanics.map((m) => (
              <MechanicRow
                key={m.id}
                jobId={jobId}
                mechanic={m}
                removing={busyId === m.id}
                disabled={pending}
                onRemove={() => setConfirm({ id: m.id, name: m.name })}
                onSaved={() => router.refresh()}
              />
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-surface-muted/50 px-3 py-4 text-sm text-muted-foreground">
            <Users className="size-4" />
            Inga mekaniker kopplade ännu.
          </p>
        )}

        {laborTotal.inclOre > 0 ? (
          <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
            <span className="font-medium text-muted-foreground">
              Arbetskostnad
            </span>
            <span className="font-semibold text-ink">
              {formatOre(laborTotal.inclOre)}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                inkl. moms
              </span>
            </span>
          </div>
        ) : null}

        {available.length > 0 ? (
          <div className="flex gap-2 border-t border-line pt-3">
            <FieldSelect
              size="sm"
              className="flex-1"
              placeholder="Välj mekaniker…"
              value={selected}
              onValueChange={setSelected}
              options={available.map((o) => ({ value: o.id, label: o.name }))}
            />
            <Button type="button" size="sm" onClick={add} disabled={pending || !selected}>
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

      <Dialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort mekaniker</DialogTitle>
            <DialogDescription>
              Vill du ta bort {confirm?.name} från arbetsordern?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Avbryt
                </Button>
              }
            />
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => confirm && remove(confirm.id)}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <X className="size-4" />
              )}
              Ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** En mekanikerrad med timlön + timmar. Sparar när ett fält lämnas (blur). */
function MechanicRow({
  jobId,
  mechanic,
  removing,
  disabled,
  onRemove,
  onSaved,
}: {
  jobId: string;
  mechanic: LinkedMechanic;
  removing: boolean;
  disabled: boolean;
  onRemove: () => void;
  onSaved: () => void;
}) {
  const [rate, setRate] = useState(oreToKrInput(mechanic.rateOre));
  const [hours, setHours] = useState(
    mechanic.hours == null ? "" : String(mechanic.hours).replace(".", ","),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Radens live-summa (utifrån det som står i fälten just nu).
  const rateOre = parseKr(rate);
  const hoursNum = parseNum(hours);
  const lineInclOre =
    rateOre != null && rateOre > 0 && hoursNum != null && hoursNum > 0
      ? partTotals({ quantity: hoursNum, unitPriceExclOre: rateOre, vatRate: 25 })
          .inclOre
      : null;

  const savedRate = oreToKrInput(mechanic.rateOre);
  const savedHours =
    mechanic.hours == null ? "" : String(mechanic.hours).replace(".", ",");

  async function save() {
    if (rate.trim() === savedRate.trim() && hours.trim() === savedHours.trim()) {
      return; // inget ändrat
    }
    setSaving(true);
    setError("");
    const res = await setMechanicLabor(jobId, mechanic.id, rate, hours);
    setSaving(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    onSaved();
  }

  return (
    <li className="py-2.5">
      <div className="flex items-center gap-3">
        <Avatar initials={initialsOf(mechanic.name)} size="size-9 text-xs" />
        <span className="flex-1 truncate text-sm font-medium text-ink">
          {mechanic.name}
        </span>
        {saving ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Ta bort ${mechanic.name}`}
          disabled={disabled}
          onClick={onRemove}
        >
          {removing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4 text-danger" />
          )}
        </Button>
      </div>

      <div className="mt-1.5 flex items-center gap-2 pl-12 text-sm">
        <div className="flex items-center gap-1">
          <input
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            onBlur={save}
            inputMode="decimal"
            placeholder="0"
            aria-label={`Timpris för ${mechanic.name}`}
            className="w-16 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm text-ink outline-none focus:border-brand-400"
          />
          <span className="text-xs text-muted-foreground">kr/tim</span>
        </div>
        <span className="text-muted-foreground">×</span>
        <div className="flex items-center gap-1">
          <input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            onBlur={save}
            inputMode="decimal"
            placeholder="0"
            aria-label={`Timmar för ${mechanic.name}`}
            className="w-14 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm text-ink outline-none focus:border-brand-400"
          />
          <span className="text-xs text-muted-foreground">tim</span>
        </div>
        <span className="ml-auto font-semibold text-ink">
          {lineInclOre != null ? formatOre(lineInclOre) : "—"}
        </span>
      </div>
      {error ? (
        <p className="mt-1 pl-12 text-xs font-medium text-danger">{error}</p>
      ) : null}
    </li>
  );
}

function parseKr(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

function parseNum(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
