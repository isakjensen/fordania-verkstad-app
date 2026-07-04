"use client";

import { useState } from "react";
import { User, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface CustomerFormDefaults {
  type?: string;
  name?: string;
  personalNumber?: string | null;
  orgNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

/**
 * Delade fält för skapa/redigera-kund. Växlar mellan privatperson och företag:
 * företag byter "Namn"→"Företagsnamn" och personnummer→organisationsnummer, och
 * (vid skapande) visar en primär kontaktperson. Att ändra typ i redigeraläget
 * konverterar kunden när formuläret sparas.
 */
export function CustomerFormFields({
  mode,
  idPrefix,
  defaults = {},
}: {
  mode: "create" | "edit";
  idPrefix: string;
  defaults?: CustomerFormDefaults;
}) {
  const [type, setType] = useState<"private" | "company">(
    defaults.type === "company" ? "company" : "private",
  );
  const isCompany = type === "company";

  return (
    <div className="space-y-4">
      {/* Typväxel */}
      <input type="hidden" name="type" value={type} />
      <div className="grid grid-cols-2 gap-2">
        <TypeButton
          active={!isCompany}
          onClick={() => setType("private")}
          icon={User}
          label="Privatperson"
        />
        <TypeButton
          active={isCompany}
          onClick={() => setType("company")}
          icon={Building2}
          label="Företag"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-name`}>
          {isCompany ? "Företagsnamn" : "Namn"}
        </Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          required
          defaultValue={defaults.name ?? ""}
          placeholder={isCompany ? "Fordania AB" : "Anna Andersson"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isCompany ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-org`}>Organisationsnummer</Label>
            <Input
              id={`${idPrefix}-org`}
              name="orgNumber"
              defaultValue={defaults.orgNumber ?? ""}
              placeholder="12345678-9012"
              inputMode="numeric"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-pnr`}>Personnummer</Label>
            <Input
              id={`${idPrefix}-pnr`}
              name="personalNumber"
              defaultValue={defaults.personalNumber ?? ""}
              placeholder="ÅÅÅÅMMDD-XXXX"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-phone`}>Telefonnummer</Label>
          <Input
            id={`${idPrefix}-phone`}
            name="phone"
            defaultValue={defaults.phone ?? ""}
            placeholder="070-123 45 67"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-email`}>E-post</Label>
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          defaultValue={defaults.email ?? ""}
          placeholder={isCompany ? "info@foretag.se" : "anna@exempel.se"}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-address`}>Adress</Label>
        <Input
          id={`${idPrefix}-address`}
          name="address"
          defaultValue={defaults.address ?? ""}
          placeholder="Storgatan 1, 123 45 Göteborg"
        />
      </div>

      {/* Primär kontaktperson – bara vid skapande av företag. Fler personer kan
          läggas till på kundprofilen efteråt (gäller både privat och företag). */}
      {mode === "create" && isCompany ? (
        <div className="space-y-3 rounded-xl border border-line bg-surface-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kontaktperson
          </p>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-contact-name`}>Namn</Label>
            <Input
              id={`${idPrefix}-contact-name`}
              name="contactName"
              placeholder="Kontaktperson på företaget"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-contact-phone`}>Telefon</Label>
              <Input
                id={`${idPrefix}-contact-phone`}
                name="contactPhone"
                placeholder="070-123 45 67"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-contact-email`}>E-post</Label>
              <Input
                id={`${idPrefix}-contact-email`}
                name="contactEmail"
                type="email"
                placeholder="namn@foretag.se"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof User;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors pointer-coarse:py-3",
        active
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
