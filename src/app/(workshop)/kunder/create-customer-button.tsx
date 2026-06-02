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
import { createCustomer } from "./actions";

export function CreateCustomerButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCustomer(formData);
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
            <span className="hidden sm:inline">Lägg till kund</span>
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny kund</DialogTitle>
          <DialogDescription>
            Lägg till en kund i kundregistret.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Namn</Label>
            <Input id="c-name" name="name" required placeholder="Anna Andersson" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-pnr">Personnummer</Label>
              <Input
                id="c-pnr"
                name="personalNumber"
                placeholder="ÅÅÅÅMMDD-XXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Telefonnummer</Label>
              <Input id="c-phone" name="phone" placeholder="070-123 45 67" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">E-post</Label>
            <Input
              id="c-email"
              name="email"
              type="email"
              placeholder="anna@exempel.se"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-address">Adress</Label>
            <Input
              id="c-address"
              name="address"
              placeholder="Storgatan 1, 123 45 Göteborg"
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
              Skapa kund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
