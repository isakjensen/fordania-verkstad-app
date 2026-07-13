"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { updateVehicle, deleteVehicle } from "./actions";
import { formatPlate } from "@/lib/plate-ocr";

interface Field {
  id: string;
  label: string;
  type: string;
  value: string;
}

const typeToInput: Record<string, string> = {
  text: "text",
  number: "number",
  date: "date",
};

export function VehicleActions({
  vehicle,
  fields,
}: {
  vehicle: {
    id: string;
    regNo: string;
    chassisNumber: string | null;
    brand: string | null;
    model: string | null;
    year: number | null;
  };
  fields: Field[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateVehicle(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setEditOpen(false);
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteVehicle(vehicle.id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      // Navigera tillbaka till listan – använd replace så back-knappen inte
      // går till det raderade fordonet, och INTE router.refresh() (den skulle
      // ladda om detaljsidan för det borttagna fordonet → 404).
      router.replace("/fordon");
    });
  }

  return (
    <div className="flex items-center gap-2">
      {/* Redigera */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          render={
            <Button variant="secondary" size="md">
              <Pencil className="size-4" />
              Redigera
            </Button>
          }
        />
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redigera fordon</DialogTitle>
            <DialogDescription>
              Uppdatera registreringsnummer, chassinummer och uppgifter.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <input type="hidden" name="id" value={vehicle.id} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-reg">Registreringsnummer</Label>
                <Input
                  id="ev-reg"
                  name="regNo"
                  required
                  defaultValue={formatPlate(vehicle.regNo)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-chassis">Chassinummer</Label>
                <Input
                  id="ev-chassis"
                  name="chassisNumber"
                  defaultValue={vehicle.chassisNumber ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-brand">Märke</Label>
                <Input
                  id="ev-brand"
                  name="brand"
                  defaultValue={vehicle.brand ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-model">Modell</Label>
                <Input
                  id="ev-model"
                  name="model"
                  defaultValue={vehicle.model ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-year">Årtal</Label>
                <Input
                  id="ev-year"
                  name="year"
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={2100}
                  placeholder="ÅÅÅÅ"
                  defaultValue={vehicle.year ?? ""}
                />
              </div>
            </div>

            {fields.length > 0 ? (
              <div className="space-y-3 rounded-lg border border-line bg-surface-muted/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fordonsuppgifter
                </p>
                {fields.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={`ev-field_${f.id}`}>{f.label}</Label>
                    <Input
                      id={`ev-field_${f.id}`}
                      name={`field_${f.id}`}
                      type={typeToInput[f.type] ?? "text"}
                      defaultValue={f.value}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    Avbryt
                  </Button>
                }
              />
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Spara
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ta bort */}
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="destructive" size="icon-md" aria-label="Ta bort fordon">
              <Trash2 className="size-4" />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort fordon?</DialogTitle>
            <DialogDescription>
              {formatPlate(vehicle.regNo)} döljs från registret men raderas inte helt. Du kan
              återställa det när som helst under &quot;Borttagna&quot; på
              fordonssidan.
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
              onClick={onDelete}
              disabled={pending}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
