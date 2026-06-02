"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldSelect } from "@/components/ui/field-select";
import {
  createFieldDefinition,
  deleteFieldDefinition,
} from "../fordon/actions";

const TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "number", label: "Siffra" },
  { value: "date", label: "Datum" },
];

interface FieldDef {
  id: string;
  label: string;
  type: string;
}

const typeLabels: Record<string, string> = {
  text: "Text",
  number: "Siffra",
  date: "Datum",
};

export function VehicleFieldsManager({
  fields,
}: {
  fields: FieldDef[];
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.set("label", label);
    formData.set("type", type);
    startTransition(async () => {
      const res = await createFieldDefinition(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setLabel("");
      setType("text");
      router.refresh();
    });
  }

  function onDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteFieldDefinition(id);
      if ("error" in res) {
        setError(res.error);
      }
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Befintliga fält */}
      {fields.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {fields.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 bg-surface px-4 py-3"
            >
              <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
              <span className="flex-1 text-sm font-medium text-ink">
                {f.label}
              </span>
              <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {typeLabels[f.type] ?? f.type}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Ta bort fältet ${f.label}`}
                disabled={pending}
                onClick={() => onDelete(f.id)}
              >
                {deletingId === f.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4 text-danger" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-surface-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          Inga egna fält ännu. Lägg till t.ex. <em>Märke</em>, <em>Modell</em>,{" "}
          <em>Årsmodell</em> eller <em>Färg</em> nedan – de dyker upp på alla
          fordon.
        </p>
      )}

      {/* Lägg till nytt fält */}
      <form
        onSubmit={onAdd}
        className="flex flex-col gap-3 rounded-xl border border-line bg-surface-muted/40 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="new-field-label">Nytt fält</Label>
          <Input
            id="new-field-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="t.ex. Märke"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-field-type">Typ</Label>
          <FieldSelect
            id="new-field-type"
            options={TYPE_OPTIONS}
            value={type}
            onValueChange={setType}
            className="sm:w-36"
          />
        </div>
        <Button type="submit" disabled={pending || !label.trim()}>
          {pending && !deletingId ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Lägg till
        </Button>
      </form>

      {error ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
