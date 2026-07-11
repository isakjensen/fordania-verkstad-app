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
import { linkMechanic, unlinkMechanic } from "./actions";

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

export function MechanicLinks({
  jobId,
  mechanics,
  options,
}: {
  jobId: string;
  mechanics: { id: string; name: string }[];
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
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <Avatar initials={initialsOf(m.name)} size="size-9 text-xs" />
                <span className="flex-1 truncate text-sm font-medium text-ink">
                  {m.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Ta bort ${m.name}`}
                  disabled={pending}
                  onClick={() => setConfirm({ id: m.id, name: m.name })}
                >
                  {busyId === m.id ? (
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
            Inga mekaniker kopplade ännu.
          </p>
        )}

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
