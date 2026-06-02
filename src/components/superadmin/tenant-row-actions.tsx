"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldSelect } from "@/components/ui/field-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { updateTenant, deleteTenant } from "@/app/superadmin/actions";
import type { TenantRow } from "@/lib/data/platform";

const planOptions = [
  { value: "Bas", label: "Bas" },
  { value: "Plus", label: "Plus" },
  { value: "Enterprise", label: "Enterprise" },
];

const statusOptions = [
  { value: "active", label: "Aktiv" },
  { value: "trial", label: "Testperiod" },
  { value: "paused", label: "Pausad" },
  { value: "invited", label: "Inbjuden" },
];

export function TenantRowActions({ tenant }: { tenant: TenantRow }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateTenant(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setEditOpen(false);
      router.refresh();
    });
  }

  function onDelete() {
    setError("");
    startTransition(async () => {
      const res = await deleteTenant(tenant.id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-ink aria-expanded:bg-slate-100 aria-expanded:text-ink"
              aria-label={`Hantera ${tenant.name}`}
            >
              <MoreHorizontal className="size-5" />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Redigera
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Ta bort
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Redigera-dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera företag</DialogTitle>
            <DialogDescription>
              Uppdatera uppgifterna för {tenant.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onEdit} className="space-y-4">
            <input type="hidden" name="id" value={tenant.id} />
            <div className="space-y-1.5">
              <Label htmlFor={`name-${tenant.id}`}>Företagsnamn</Label>
              <Input
                id={`name-${tenant.id}`}
                name="name"
                required
                defaultValue={tenant.name}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`city-${tenant.id}`}>Stad</Label>
              <Input
                id={`city-${tenant.id}`}
                name="city"
                defaultValue={tenant.city ?? ""}
                placeholder="Göteborg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`plan-${tenant.id}`}>Plan</Label>
                <FieldSelect
                  id={`plan-${tenant.id}`}
                  name="plan"
                  defaultValue={tenant.plan}
                  options={planOptions}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`status-${tenant.id}`}>Status</Label>
                <FieldSelect
                  id={`status-${tenant.id}`}
                  name="status"
                  defaultValue={tenant.status}
                  options={statusOptions}
                />
              </div>
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
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Pencil className="size-4" />
                )}
                Spara
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ta bort-dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort företag</DialogTitle>
            <DialogDescription>
              Är du säker på att du vill ta bort {tenant.name}? Alla användare,
              fordon, mekaniker och jobb kopplade till företaget raderas
              permanent. Detta går inte att ångra.
            </DialogDescription>
          </DialogHeader>

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
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={pending}
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
    </>
  );
}
