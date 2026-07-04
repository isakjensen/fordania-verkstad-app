"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldSelect } from "@/components/ui/field-select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
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
import { updateWorkOrder, deleteWorkOrder } from "./actions";
import { TYPE_OPTIONS, STATUS_OPTIONS, PRIORITY_OPTIONS } from "./meta";

interface JobInfo {
  id: string;
  type: string;
  status: string;
  priority: string;
  description: string | null;
  scheduledStart: Date | string | null;
  scheduledEnd: Date | string | null;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function hm(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function WorkOrderActions({ job }: { job: JobInfo }) {
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;

  const [editOpen, setEditOpen] = useState(false);
  const [date, setDate] = useState(start ? ymd(start) : "");
  const [startTime, setStartTime] = useState(start ? hm(start) : "08:00");
  const [endTime, setEndTime] = useState(end ? hm(end) : "10:00");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("date", date);
    formData.set("startTime", startTime);
    formData.set("endTime", endTime);
    startTransition(async () => {
      const res = await updateWorkOrder(formData);
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
      const res = await deleteWorkOrder(job.id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push("/arbetsordrar");
      router.refresh();
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Redigera arbetsorder</DialogTitle>
            <DialogDescription>
              Uppdatera typ, status, tid och beskrivning.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <input type="hidden" name="id" value={job.id} />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="e-type">Typ</Label>
                <FieldSelect id="e-type" name="type" defaultValue={job.type} options={TYPE_OPTIONS} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-status">Status</Label>
                <FieldSelect id="e-status" name="status" defaultValue={job.status} options={STATUS_OPTIONS} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-prio">Prioritet</Label>
                <FieldSelect id="e-prio" name="priority" defaultValue={job.priority} options={PRIORITY_OPTIONS} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="e-date">Datum</Label>
                <DatePicker id="e-date" value={date} onChange={setDate} placeholder="Ej schemalagd" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-start">Från</Label>
                <TimePicker id="e-start" value={startTime} onChange={setStartTime} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-end">Till</Label>
                <TimePicker id="e-end" value={endTime} onChange={setEndTime} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-desc">Beskrivning</Label>
              <Input id="e-desc" name="description" defaultValue={job.description ?? ""} />
            </div>

            {error ? (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline">Avbryt</Button>} />
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
            <Button variant="destructive" size="icon" aria-label="Ta bort arbetsorder">
              <Trash2 className="size-4" />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort arbetsorder?</DialogTitle>
            <DialogDescription>
              Arbetsordern och dess delar tas bort permanent. Detta går inte att
              ångra.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Avbryt</Button>} />
            <Button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
