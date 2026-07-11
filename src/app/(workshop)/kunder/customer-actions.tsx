"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CustomerFormFields } from "./customer-form-fields";

interface CustomerData {
  id: string;
  type: string;
  name: string;
  personalNumber: string | null;
  orgNumber: string | null;
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
      // Navigera till listan med replace så back-knappen inte går till den
      // borttagna kunden (detaljsidan skulle då ge 404).
      router.replace("/kunder");
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera kund</DialogTitle>
            <DialogDescription>
              Uppdatera uppgifterna. Byt typ för att konvertera mellan
              privatperson och företag.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <input type="hidden" name="id" value={customer.id} />
            <CustomerFormFields
              mode="edit"
              idPrefix="e"
              defaults={{
                type: customer.type,
                name: customer.name,
                personalNumber: customer.personalNumber,
                orgNumber: customer.orgNumber,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
              }}
            />

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
            <Button variant="destructive" size="icon-md" aria-label="Ta bort kund">
              <Trash2 className="size-4" />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort kund?</DialogTitle>
            <DialogDescription>
              {customer.name} döljs från registret men raderas inte helt. Du kan
              återställa kunden när som helst under &quot;Borttagna&quot; på
              kundsidan.
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
