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
import { createTenant } from "@/app/superadmin/actions";

export function CreateTenantButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTenant(formData);
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
          <Button size="sm" variant="success">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Lägg till kund</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny kund</DialogTitle>
          <DialogDescription>
            Skapa ett nytt företag (tenant) på plattformen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Företagsnamn</Label>
            <Input id="name" name="name" required placeholder="Eriks Biluthyrning" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Stad</Label>
            <Input id="city" name="city" placeholder="Göteborg" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan">Plan</Label>
            <select
              id="plan"
              name="plan"
              defaultValue="Bas"
              className="h-9 w-full rounded-lg border border-line bg-surface-muted px-3 text-sm text-ink focus:border-brand-300 focus:bg-surface focus:outline-none"
            >
              <option value="Bas">Bas</option>
              <option value="Plus">Plus</option>
              <option value="Enterprise">Enterprise</option>
            </select>
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
              Skapa kund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
