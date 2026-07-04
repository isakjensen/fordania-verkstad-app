"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldSelect } from "@/components/ui/field-select";
import { DatePicker } from "@/components/ui/date-picker";
import { partTotals, orderTotals, formatOre } from "@/lib/pricing";
import { VAT_OPTIONS } from "./meta";
import { addPart, removePart } from "./actions";

interface Part {
  id: string;
  title: string;
  purchaseDate: Date;
  quantity: number;
  unitPriceExclOre: number;
  vatRate: number;
}

const df = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" });

export function PartList({ jobId, parts }: { jobId: string; parts: Part[] }) {
  const [date, setDate] = useState("");
  const [vat, setVat] = useState("25");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  const totals = orderTotals(parts);

  function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("jobId", jobId);
    formData.set("vatRate", vat);
    if (date) formData.set("purchaseDate", date);
    setBusyId("add");
    startTransition(async () => {
      const res = await addPart(formData);
      if ("error" in res) {
        setError(res.error);
      } else {
        form.reset();
        setDate("");
        setVat("25");
      }
      setBusyId(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await removePart(id);
      if ("error" in res) setError(res.error);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader tone="brand" title="Delar / inköp" />
      <CardBody className="space-y-4">
        {parts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Datum</th>
                  <th className="py-2 pr-3">Benämning</th>
                  <th className="py-2 pr-3 text-right">Antal</th>
                  <th className="py-2 pr-3 text-right">à-pris</th>
                  <th className="py-2 pr-3 text-right">Moms</th>
                  <th className="py-2 pr-3 text-right">Summa inkl.</th>
                  <th className="w-8 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {parts.map((p) => {
                  const t = partTotals(p);
                  return (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {df.format(new Date(p.purchaseDate))}
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-ink">
                        {p.title}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-ink-soft">
                        {p.quantity}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-ink-soft">
                        {formatOre(p.unitPriceExclOre)}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                        {p.vatRate} %
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-ink">
                        {formatOre(t.inclOre)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Ta bort ${p.title}`}
                          disabled={pending}
                          onClick={() => remove(p.id)}
                        >
                          {busyId === p.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4 text-danger" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line text-sm">
                  <td colSpan={4} />
                  <td className="py-2 pr-3 text-right text-muted-foreground">
                    Exkl. moms
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ink-soft">
                    {formatOre(totals.exclOre)}
                  </td>
                  <td />
                </tr>
                <tr className="text-sm">
                  <td colSpan={4} />
                  <td className="py-1 pr-3 text-right text-muted-foreground">
                    Moms
                  </td>
                  <td className="py-1 pr-3 text-right tabular-nums text-ink-soft">
                    {formatOre(totals.vatOre)}
                  </td>
                  <td />
                </tr>
                <tr className="text-sm">
                  <td colSpan={4} />
                  <td className="py-1 pr-3 text-right font-semibold text-ink">
                    Totalt inkl. moms
                  </td>
                  <td className="py-1 pr-3 text-right text-base font-extrabold tabular-nums text-brand-700">
                    {formatOre(totals.inclOre)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-lg bg-surface-muted/50 px-3 py-4 text-sm text-muted-foreground">
            <Receipt className="size-4" />
            Inga delar eller inköp tillagda ännu.
          </p>
        )}

        {/* Lägg till rad */}
        <form
          onSubmit={onAdd}
          className="grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-12"
        >
          <div className="col-span-2 space-y-1.5 sm:col-span-4">
            <Label htmlFor="p-title">Benämning</Label>
            <Input id="p-title" name="title" required placeholder="t.ex. Oljefilter" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-qty">Antal</Label>
            <Input id="p-qty" name="quantity" type="number" min={1} defaultValue={1} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-price">à-pris exkl.</Label>
            <Input id="p-price" name="priceExcl" required placeholder="0,00" inputMode="decimal" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-vat">Moms</Label>
            <FieldSelect
              id="p-vat"
              value={vat}
              onValueChange={setVat}
              options={VAT_OPTIONS}
            />
          </div>
          <div className="col-span-2 space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-date">Datum</Label>
            <DatePicker id="p-date" value={date} onChange={setDate} placeholder="Idag" />
          </div>
          <div className="col-span-2 flex items-end sm:col-span-12">
            <Button type="submit" disabled={pending}>
              {busyId === "add" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Lägg till rad
            </Button>
          </div>
        </form>

        {error ? (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
