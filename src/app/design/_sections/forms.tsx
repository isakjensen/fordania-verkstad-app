"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { Group, Live, Section, Variant } from "../_components/kit";

/* ------------------------------------------------------------------ *
 *  Fält, väljare och kontroller.
 * ------------------------------------------------------------------ */

const fieldBase =
  "h-10 w-full rounded-lg px-3 text-sm text-ink outline-none transition-all placeholder:text-muted-foreground";

const fields: {
  label: string;
  name: string;
  note?: string;
  source?: string;
  cls: string;
}[] = [
  {
    label: "A",
    name: "Kontur + fokusring",
    source: "components/ui/input.tsx",
    cls: "border border-input bg-transparent focus:border-ring focus:ring-3 focus:ring-ring/50 dark:bg-input/30",
  },
  {
    label: "B",
    name: "Mjuk fyllnad",
    note: "kant först vid fokus",
    cls: "border border-transparent bg-surface-muted focus:border-ring focus:bg-surface focus:ring-3 focus:ring-ring/40",
  },
  {
    label: "C",
    name: "Understruken",
    note: "minimalt, luftigt",
    cls: "rounded-none border-0 border-b border-line-strong bg-transparent px-1 focus:border-brand-600",
  },
  {
    label: "D",
    name: "Inskuggad",
    note: "känns som en fördjupning",
    cls: "border border-line-strong bg-surface-muted shadow-[inset_0_1px_2px_rgba(20,28,40,0.06)] focus:border-ring focus:ring-3 focus:ring-ring/40",
  },
];

function LabeledField({ cls }: { cls: string }) {
  return (
    <div className="w-full space-y-3">
      <div className="space-y-1.5">
        <label className="text-[0.8rem] font-medium text-ink-soft">
          Kundens namn
        </label>
        <input className={cn(fieldBase, cls)} placeholder="Ex. Anna Bergman" />
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={cn(fieldBase, cls, "pl-9")}
          placeholder="Sök fordon…"
        />
      </div>
      <input
        className={cn(
          fieldBase,
          cls,
          "border-danger! ring-danger/20 focus:ring-3",
        )}
        defaultValue="ABC 12"
        aria-invalid
      />
    </div>
  );
}

function Toggle({ variant }: { variant: "pill" | "square" | "brand" }) {
  const [on, setOn] = useState(true);
  if (variant === "square") {
    return (
      <button
        onClick={() => setOn(!on)}
        className={cn(
          "inline-flex h-7 w-12 items-center rounded-md border p-0.5 transition-colors",
          on
            ? "border-brand-600 bg-brand-600"
            : "border-line-strong bg-surface-muted",
        )}
        aria-pressed={on}
      >
        <span
          className={cn(
            "size-5 rounded-[4px] bg-white shadow-card transition-transform",
            on && "translate-x-5",
          )}
        />
      </button>
    );
  }
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn(
        "inline-flex h-7 w-12 items-center rounded-full p-0.5 transition-colors",
        on
          ? variant === "brand"
            ? "brand-fill"
            : "bg-ink"
          : "bg-line-strong",
      )}
      aria-pressed={on}
    >
      <span
        className={cn(
          "size-6 rounded-full bg-white shadow-card transition-transform",
          on && "translate-x-5",
        )}
      />
    </button>
  );
}

/**
 * Kryssrutan. Fyrkantiga varianten är exakt den som körs i order- och
 * fordonslistornas markeringsläge (order-rows.tsx).
 */
function Checkbox({ round }: { round?: boolean }) {
  const [on, setOn] = useState(true);
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center border transition-colors",
        round ? "rounded-full" : "rounded-md",
        on
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-line bg-surface",
      )}
      aria-pressed={on}
    >
      {on ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </button>
  );
}

export function FormsSection() {
  return (
    <div className="space-y-10">
      <Section
        title="Textfält"
        description="Fältet är appens mest använda yta – varje arbetsorder, kund och fordon fylls i här. Nedersta fältet i varje ruta visar felläget."
      >
        <Group title="Förslag" cols={2}>
          {fields.map((f) => (
            <Variant
              key={f.label}
              label={f.label}
              name={f.name}
              note={f.note}
              source={f.source}
              className="items-start"
            >
              <LabeledField cls={f.cls} />
            </Variant>
          ))}
        </Group>
        <Group title="Komponenten som körs" cols={1}>
          <Live name="Input" source="components/ui/input.tsx" className="items-start">
            <div className="w-full max-w-sm space-y-2">
              <Input placeholder="Standard" />
              <Input placeholder="Fel" aria-invalid />
              <Input placeholder="Inaktiverad" disabled />
            </div>
          </Live>
        </Group>
      </Section>

      <Section
        title="Etiketter"
        description="Var texten sitter påverkar hur tät en lång blankett känns."
      >
        <Group title="Förslag" cols={3}>
          <Variant label="A" name="Etikett ovanför" source="components/ui/label.tsx · alla formulär" className="items-start">
            <div className="w-full space-y-1.5">
              <label className="text-[0.8rem] font-medium text-ink-soft">
                Mätarställning
              </label>
              <input className={cn(fieldBase, fields[0].cls)} placeholder="0" />
              <p className="text-xs text-muted-foreground">Anges i kilometer.</p>
            </div>
          </Variant>
          <Variant label="B" name="Etikett i fältet" className="items-start">
            <div className="w-full">
              <div className="rounded-lg border border-input px-3 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
                <span className="block text-[0.68rem] font-medium tracking-wide text-muted-foreground uppercase">
                  Mätarställning
                </span>
                <input
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
                  placeholder="0"
                />
              </div>
            </div>
          </Variant>
          <Variant label="C" name="Etikett till vänster" className="items-start">
            <div className="flex w-full items-center gap-3">
              <label className="w-28 shrink-0 text-[0.8rem] font-medium text-ink-soft">
                Mätarställning
              </label>
              <input className={cn(fieldBase, fields[0].cls)} placeholder="0" />
            </div>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Reglage och kryssrutor"
        description="Kryssrutan används i listornas markeringsläge. Reglagen finns inte i appen än – de är rena förslag."
      >
        <Group
          title="Förslag"
          hint="reglagen är oanvända i dag – inget av dem är live"
          cols={3}
        >
          <Variant label="A" name="Piller, bläcksvart">
            <Toggle variant="pill" />
            <span className="text-sm text-ink-soft">Neutral på</span>
          </Variant>
          <Variant label="B" name="Piller, varumärke">
            <Toggle variant="brand" />
            <span className="text-sm text-ink-soft">Orange på</span>
          </Variant>
          <Variant label="C" name="Fyrkantig">
            <Toggle variant="square" />
            <span className="text-sm text-ink-soft">Kantigare</span>
          </Variant>
          <Variant
            label="D"
            name="Kryssruta, rundad"
            source="arbetsordrar/order-rows.tsx · fordon/vehicles-view.tsx"
          >
            <Checkbox />
            <span className="text-sm text-ink-soft">Oljebyte utfört</span>
          </Variant>
          <Variant label="E" name="Kryssruta, cirkel">
            <Checkbox round />
            <span className="text-sm text-ink-soft">Oljebyte utfört</span>
          </Variant>
          <Variant label="F" name="Valbara kort">
            <div className="flex flex-wrap gap-2">
              {["Service", "Däckbyte", "Besiktning"].map((t, i) => (
                <label
                  key={t}
                  className={cn(
                    "cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors",
                    i === 0
                      ? "border-brand-600 bg-brand-500/10 text-brand-700"
                      : "border-line-strong bg-surface text-ink-soft hover:border-line-strong hover:bg-surface-muted",
                  )}
                >
                  {t}
                </label>
              ))}
            </div>
          </Variant>
        </Group>
      </Section>
    </div>
  );
}
