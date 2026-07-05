"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
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
import { createVehicle } from "./actions";

interface FieldDef {
  id: string;
  label: string;
  type: string;
}

const typeToInput: Record<string, string> = {
  text: "text",
  number: "number",
  date: "date",
};

export function CreateVehicleButton({
  fieldDefinitions,
}: {
  fieldDefinitions: FieldDef[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createVehicle(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="md" variant="success">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Lägg till fordon</span>
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nytt fordon</DialogTitle>
          <DialogDescription>
            Registreringsnummer och chassinummer är fasta. Övriga fält är de
            verkstaden själv definierat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-reg">Registreringsnummer</Label>
              <Input id="v-reg" name="regNo" required placeholder="ABC 123" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-chassis">Chassinummer</Label>
              <Input id="v-chassis" name="chassisNumber" placeholder="WVW…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-brand">Märke</Label>
              <Input id="v-brand" name="brand" placeholder="t.ex. Volvo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-model">Modell</Label>
              <Input id="v-model" name="model" placeholder="t.ex. XC60" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-year">Årtal</Label>
              <Input
                id="v-year"
                name="year"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                placeholder="ÅÅÅÅ"
              />
            </div>
          </div>

          {/* Dynamiska fält */}
          {fieldDefinitions.length > 0 ? (
            <div className="space-y-3 rounded-lg border border-line bg-surface-muted/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fordonsuppgifter
              </p>
              {fieldDefinitions.map((def) => (
                <div key={def.id} className="space-y-1.5">
                  <Label htmlFor={`field_${def.id}`}>{def.label}</Label>
                  <Input
                    id={`field_${def.id}`}
                    name={`field_${def.id}`}
                    type={typeToInput[def.type] ?? "text"}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="v-odo">Mätarställning (km)</Label>
            <Input id="v-odo" name="odometer" type="number" placeholder="0" />
          </div>

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
            <Button type="submit" variant="success" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Skapa fordon
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
