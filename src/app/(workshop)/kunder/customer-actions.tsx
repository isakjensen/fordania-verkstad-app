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
import { updateCustomer, deleteCustomer } from "./actions";

interface CustomerData {
  id: string;
  name: string;
  personalNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export function CustomerActions({ customer }: { customer: CustomerData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateCustomer(formData);
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
      const res = await deleteCustomer(customer.id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push("/kunder");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {/* Redigera */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" size="md">
              <Pencil className="size-4" />
              Redigera
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera kund</DialogTitle>
            <DialogDescription>Uppdatera kundens uppgifter.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <input type="hidden" name="id" value={customer.id} />
            <div className="space-y-1.5">
              <Label htmlFor="e-name">Namn</Label>
              <Input id="e-name" name="name" required defaultValue={customer.name} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="e-pnr">Personnummer</Label>
                <Input
                  id="e-pnr"
                  name="personalNumber"
                  defaultValue={customer.personalNumber ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-phone">Telefonnummer</Label>
                <Input
                  id="e-phone"
                  name="phone"
                  defaultValue={customer.phone ?? ""}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-email">E-post</Label>
              <Input
                id="e-email"
                name="email"
                type="email"
                defaultValue={customer.email ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-address">Adress</Label>
              <Input
                id="e-address"
                name="address"
                defaultValue={customer.address ?? ""}
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
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Spara
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ta bort */}
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Ta bort kund">
              <Trash2 className="size-4 text-danger" />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort kund?</DialogTitle>
            <DialogDescription>
              {customer.name} och alla kommentarer tas bort permanent. Detta går
              inte att ångra.
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
