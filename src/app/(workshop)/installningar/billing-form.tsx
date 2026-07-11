"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkshopBilling } from "./billing-actions";
import type { WorkshopBilling } from "@/lib/data/settings";

export function BillingForm({ billing }: { billing: WorkshopBilling }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateWorkshopBilling(fd);
      if ("error" in res) {
        setMsg({ ok: false, text: res.error });
      } else {
        setMsg({ ok: true, text: "Fakturauppgifterna sparades." });
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="orgNumber"
          label="Organisationsnummer"
          defaultValue={billing.orgNumber}
          placeholder="556123-4567"
        />
        <Field
          name="vatNumber"
          label="Momsreg.nr"
          defaultValue={billing.vatNumber}
          placeholder="SE556123456701"
        />
        <Field
          name="address"
          label="Adress"
          defaultValue={billing.address}
          placeholder="Verkstadsgatan 1"
          className="sm:col-span-2"
        />
        <Field
          name="postalCode"
          label="Postnummer"
          defaultValue={billing.postalCode}
          placeholder="123 45"
        />
        <Field
          name="city"
          label="Ort"
          defaultValue={billing.city}
          placeholder="Göteborg"
        />
        <Field
          name="email"
          label="Faktura-e-post"
          defaultValue={billing.email}
          placeholder="faktura@verkstad.se"
          type="email"
        />
        <Field
          name="phone"
          label="Telefon"
          defaultValue={billing.phone}
          placeholder="031-123 45 67"
        />
        <Field
          name="bankgiro"
          label="Bankgiro"
          defaultValue={billing.bankgiro}
          placeholder="123-4567"
        />
        <Field
          name="paymentTermsDays"
          label="Betalningsvillkor (dagar)"
          defaultValue={String(billing.paymentTermsDays)}
          type="number"
        />
      </div>

      {msg ? (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium",
            msg.ok
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger",
          )}
        >
          {msg.ok ? (
            <Check className="mr-1.5 inline size-4 align-text-bottom" />
          ) : null}
          {msg.text}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Spara uppgifter
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`b-${name}`}>{label}</Label>
      <Input
        id={`b-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
      />
    </div>
  );
}
