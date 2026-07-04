"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Users,
  Star,
  Trash2,
  Loader2,
  Phone,
  Mail,
  X,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { addContact, deleteContact, setPrimaryContact } from "./actions";

interface Contact {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
}

export function ContactPersons({
  customerId,
  contacts,
  isCompany,
}: {
  customerId: string;
  contacts: Contact[];
  isCompany: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusyId("add");
    const formData = new FormData(e.currentTarget);
    formData.set("customerId", customerId);
    startTransition(async () => {
      const res = await addContact(formData);
      if ("error" in res) setError(res.error);
      else {
        formRef.current?.reset();
        setShowAdd(false);
      }
      setBusyId(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    setError("");
    setBusyId(id);
    startTransition(async () => {
      const res = await deleteContact(id);
      if ("error" in res) setError(res.error);
      setBusyId(null);
      router.refresh();
    });
  }

  function makePrimary(id: string) {
    setError("");
    setBusyId(id);
    startTransition(async () => {
      const res = await setPrimaryContact(id);
      if ("error" in res) setError(res.error);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Kontaktpersoner"
        subtitle={
          isCompany
            ? "Kontaktperson på företaget och andra som får lämna/hämta fordon"
            : "Personer som får lämna eller hämta ut fordon"
        }
        action={
          <Button
            type="button"
            size="sm"
            variant={showAdd ? "outline" : "secondary"}
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? (
              <>
                <X className="size-4" />
                Avbryt
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                Lägg till
              </>
            )}
          </Button>
        }
      />
      <CardBody className="space-y-4">
        {/* Lägg till-formulär */}
        {showAdd ? (
          <form
            ref={formRef}
            onSubmit={add}
            className="space-y-3 rounded-xl border border-line bg-surface-muted/40 p-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ct-name">Namn</Label>
                <Input id="ct-name" name="name" required placeholder="För- och efternamn" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-role">Roll / notis</Label>
                <Input
                  id="ct-role"
                  name="role"
                  placeholder={isCompany ? "Kontaktperson" : "Hämtar bil"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-phone">Telefon</Label>
                <Input id="ct-phone" name="phone" placeholder="070-123 45 67" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-email">E-post</Label>
                <Input id="ct-email" name="email" type="email" placeholder="namn@exempel.se" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="isPrimary"
                defaultChecked={isCompany && contacts.length === 0}
                className="size-4 rounded border-line text-brand-600 focus:ring-brand-300"
              />
              Ange som primär kontaktperson
            </label>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={pending}>
                {busyId === "add" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Lägg till kontaktperson
              </Button>
            </div>
          </form>
        ) : null}

        {/* Lista */}
        {contacts.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg bg-surface-muted/50 px-3 py-4 text-sm text-muted-foreground">
            <Users className="size-4" />
            Inga kontaktpersoner tillagda ännu.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    c.isPrimary
                      ? "bg-brand-600 text-white"
                      : "bg-brand-50 text-brand-700",
                  )}
                >
                  {initialsOf(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    {c.isPrimary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[0.7rem] font-semibold text-brand-700">
                        <Star className="size-3 fill-current" />
                        Primär
                      </span>
                    ) : null}
                    {c.role ? (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
                        {c.role}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1 hover:text-brand-600"
                      >
                        <Phone className="size-3" />
                        {c.phone}
                      </a>
                    ) : null}
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1 hover:text-brand-600"
                      >
                        <Mail className="size-3" />
                        {c.email}
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!c.isPrimary ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Gör ${c.name} till primär kontaktperson`}
                      title="Gör till primär kontaktperson"
                      disabled={pending}
                      onClick={() => makePrimary(c.id)}
                    >
                      {busyId === c.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Star className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Ta bort ${c.name}`}
                    disabled={pending}
                    onClick={() => remove(c.id)}
                  >
                    {busyId === c.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4 text-danger" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {error ? (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

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
