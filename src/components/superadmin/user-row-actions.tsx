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
import { updateUser, removeUserFromTenant } from "@/app/superadmin/actions";
import type { PlatformUserRow } from "@/lib/data/platform";

const roleOptions = [
  { value: "member", label: "Användare" },
  { value: "admin", label: "Admin" },
];

const statusOptions = [
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Inaktiv" },
];

export function UserRowActions({ user }: { user: PlatformUserRow }) {
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
      const res = await updateUser(formData);
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
      const res = await removeUserFromTenant(user.memberId);
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
              aria-label={`Hantera ${user.name}`}
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
            <DialogTitle>Redigera användare</DialogTitle>
            <DialogDescription>
              {user.email} · {user.tenantName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onEdit} className="space-y-4">
            <input type="hidden" name="memberId" value={user.memberId} />
            <div className="space-y-1.5">
              <Label htmlFor={`uname-${user.memberId}`}>Namn</Label>
              <Input
                id={`uname-${user.memberId}`}
                name="name"
                required
                defaultValue={user.name}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`urole-${user.memberId}`}>Roll</Label>
                <FieldSelect
                  id={`urole-${user.memberId}`}
                  name="role"
                  defaultValue={user.role}
                  options={roleOptions}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`ustatus-${user.memberId}`}>Status</Label>
                <FieldSelect
                  id={`ustatus-${user.memberId}`}
                  name="status"
                  defaultValue={user.status}
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
            <DialogTitle>Ta bort användare</DialogTitle>
            <DialogDescription>
              Ta bort {user.name} från {user.tenantName}? Användaren förlorar
              åtkomst till företaget. Om det är användarens enda företag raderas
              även kontot helt.
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
