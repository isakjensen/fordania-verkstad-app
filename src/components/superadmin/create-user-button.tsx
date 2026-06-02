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
import { createUserInTenant } from "@/app/superadmin/actions";

const selectClass =
  "h-9 w-full rounded-lg border border-line bg-surface-muted px-3 text-sm text-ink focus:border-brand-300 focus:bg-surface focus:outline-none";

export function CreateUserButton({
  tenants,
}: {
  tenants: { id: string; name: string }[];
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
      const res = await createUserInTenant(formData);
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
          <Button size="sm" variant="success" disabled={tenants.length === 0}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Skapa användare</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny användare</DialogTitle>
          <DialogDescription>
            Användaren loggar in med e-post och det tillfälliga lösenordet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Namn</Label>
            <Input id="u-name" name="name" required placeholder="Anna Andersson" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-email">E-post</Label>
            <Input
              id="u-email"
              name="email"
              type="email"
              required
              placeholder="anna@foretag.se"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-password">Tillfälligt lösenord</Label>
            <Input
              id="u-password"
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="Minst 8 tecken"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-org">Tenant</Label>
              <select id="u-org" name="organizationId" required className={selectClass}>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-role">Roll</Label>
              <select id="u-role" name="role" defaultValue="member" className={selectClass}>
                <option value="member">Användare</option>
                <option value="admin">Admin</option>
                <option value="owner">Ägare</option>
              </select>
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
            <Button type="submit" variant="success" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Skapa användare
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
