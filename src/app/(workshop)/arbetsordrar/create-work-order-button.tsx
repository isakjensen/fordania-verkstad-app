"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldSelect } from "@/components/ui/field-select";
import { DatePicker } from "@/components/ui/date-picker";
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
import { createWorkOrder } from "./actions";
import { TYPE_OPTIONS, STATUS_OPTIONS, PRIORITY_OPTIONS } from "./meta";

export function CreateWorkOrderButton({
  mechanics,
  vehicles,
}: {
  mechanics: { id: string; name: string }[];
  vehicles: { id: string; regNo: string; chassisNumber: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    if (date) formData.set("date", date);
    startTransition(async () => {
      const res = await createWorkOrder(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (res.id) router.push(`/arbetsordrar/${res.id}`);
      else router.refresh();
    });
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError("");
      setDate("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button size="md" variant="success">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Ny arbetsorder</span>
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ny arbetsorder</DialogTitle>
          <DialogDescription>
            Skapa en arbetsorder. Du kopplar fler mekaniker, fordon och delar i
            detaljvyn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wo-type">Typ</Label>
              <FieldSelect
                id="wo-type"
                name="type"
                defaultValue="Service"
                options={TYPE_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-status">Status</Label>
              <FieldSelect
                id="wo-status"
                name="status"
                defaultValue="planned"
                options={STATUS_OPTIONS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-prio">Prioritet</Label>
              <FieldSelect
                id="wo-prio"
                name="priority"
                defaultValue="normal"
                options={PRIORITY_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="wo-date">Datum</Label>
              <DatePicker
                id="wo-date"
                value={date}
                onChange={setDate}
                placeholder="Ej schemalagd"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-start">Från</Label>
              <Input id="wo-start" name="startTime" type="time" defaultValue="08:00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-end">Till</Label>
              <Input id="wo-end" name="endTime" type="time" defaultValue="10:00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wo-mech">Mekaniker (valfri)</Label>
              <FieldSelect
                id="wo-mech"
                name="userId"
                placeholder="Välj mekaniker…"
                options={mechanics.map((m) => ({ value: m.id, label: m.name }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-veh">Fordon (valfritt)</Label>
              <FieldSelect
                id="wo-veh"
                name="vehicleId"
                placeholder="Välj fordon…"
                options={vehicles.map((v) => ({ value: v.id, label: v.regNo }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wo-desc">Beskrivning</Label>
            <Input
              id="wo-desc"
              name="description"
              placeholder="Vad ska göras?"
            />
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
              Skapa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
