import { cn } from "@/lib/utils";

import { Group, Section, Tile } from "../_components/kit";

/* ------------------------------------------------------------------ *
 *  Grunderna: färg, typografi, radie och skugga. Allt läser direkt ur
 *  designsystemets variabler i globals.css, så rutorna följer temat
 *  (och radie-reglaget i verktygsraden).
 * ------------------------------------------------------------------ */

/* Klassnamnen skrivs ut i klartext – Tailwind läser källkoden som text och
 * hittar inte klasser som satts ihop med mallsträngar. */
const brand = [
  { step: "50", cls: "bg-brand-50" },
  { step: "100", cls: "bg-brand-100" },
  { step: "200", cls: "bg-brand-200" },
  { step: "300", cls: "bg-brand-300" },
  { step: "400", cls: "bg-brand-400" },
  { step: "500", cls: "bg-brand-500" },
  { step: "600", cls: "bg-brand-600" },
  { step: "700", cls: "bg-brand-700" },
  { step: "800", cls: "bg-brand-800" },
  { step: "900", cls: "bg-brand-900" },
  { step: "950", cls: "bg-brand-950" },
];

const neutrals = [
  { name: "canvas", cls: "bg-canvas" },
  { name: "surface", cls: "bg-surface" },
  { name: "surface-muted", cls: "bg-surface-muted" },
  { name: "line", cls: "bg-line" },
  { name: "line-strong", cls: "bg-line-strong" },
  { name: "muted-foreground", cls: "bg-muted-foreground" },
  { name: "ink-soft", cls: "bg-ink-soft" },
  { name: "ink", cls: "bg-ink" },
  { name: "navy", cls: "bg-navy" },
];

const semantic = [
  { name: "success", cls: "bg-success", soft: "bg-success-soft" },
  { name: "warning", cls: "bg-warning", soft: "bg-warning-soft" },
  { name: "danger", cls: "bg-danger", soft: "bg-danger-soft" },
  { name: "info", cls: "bg-info", soft: "bg-info-soft" },
];

const radii = [
  { name: "rounded-sm", cls: "rounded-sm" },
  { name: "rounded-md", cls: "rounded-md" },
  { name: "rounded-lg", cls: "rounded-lg" },
  { name: "rounded-xl", cls: "rounded-xl" },
  { name: "rounded-2xl", cls: "rounded-2xl" },
  { name: "rounded-3xl", cls: "rounded-3xl" },
  { name: "rounded-4xl", cls: "rounded-4xl" },
];

const shadows = [
  { name: "shadow-soft", cls: "shadow-soft" },
  { name: "shadow-card", cls: "shadow-card" },
  { name: "shadow-chip", cls: "shadow-chip" },
  { name: "shadow-lift", cls: "shadow-lift" },
];

export function FoundationsSection() {
  return (
    <div className="space-y-10">
      <Section
        title="Färg"
        description="Paletten kommer från globals.css och vänder automatiskt i mörkt läge – jämför gärna med tema-växlaren ovan."
      >
        <Group title="Varumärke" cols={1}>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap gap-2">
              {brand.map((b) => (
                <Tile key={b.step} caption={b.step}>
                  <div
                    className={cn(
                      "size-14 rounded-lg border border-line",
                      b.cls,
                    )}
                  />
                </Tile>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="brand-fill flex h-14 w-40 items-center justify-center rounded-lg text-sm font-semibold">
                brand-fill
              </div>
              <p className="max-w-sm text-xs text-muted-foreground">
                Gradienten från loggans ”VERKSTAD”. Används på primärknappar och
                aktiva ytor.
              </p>
            </div>
          </div>
        </Group>

        <Group title="Neutraler" cols={1}>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap gap-2">
              {neutrals.map((n) => (
                <Tile key={n.name} caption={n.name}>
                  <div
                    className={cn(
                      "size-14 rounded-lg border border-line-strong",
                      n.cls,
                    )}
                  />
                </Tile>
              ))}
            </div>
          </div>
        </Group>

        <Group title="Status" cols={1}>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap gap-4">
              {semantic.map((s) => (
                <Tile key={s.name} caption={s.name}>
                  <div className="flex overflow-hidden rounded-lg border border-line">
                    <div className={cn("size-14", s.cls)} />
                    <div className={cn("size-14", s.soft)} />
                  </div>
                </Tile>
              ))}
            </div>
          </div>
        </Group>
      </Section>

      <Section
        title="Typografi"
        description="Hanken Grotesk för allt utom registreringsnummer, som sätts i Geist Mono."
      >
        <div className="space-y-4 rounded-xl border border-line bg-surface p-6">
          {[
            { cls: "text-3xl font-semibold tracking-[-0.02em]", name: "3xl / semibold – sidrubrik" },
            { cls: "text-xl font-semibold tracking-[-0.01em]", name: "xl / semibold – vyrubrik" },
            { cls: "text-[0.95rem] font-semibold", name: "0.95rem / semibold – kortrubrik" },
            { cls: "text-sm", name: "sm – brödtext" },
            { cls: "text-sm text-muted-foreground", name: "sm / muted – sekundärtext" },
            { cls: "text-xs text-muted-foreground", name: "xs / muted – hjälptext" },
            {
              cls: "text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
              name: "0.7rem / versaler – etikett",
            },
            { cls: "font-mono text-sm font-bold", name: "mono – registreringsnummer" },
          ].map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-1 border-b border-line pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <span className="w-64 shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                {t.name}
              </span>
              <span className={cn("text-ink", t.cls)}>
                Verkstaden i rörelse
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Radie"
        description="Alla radier räknas ur en enda variabel. Dra i reglaget i verktygsraden så ändras hela labbet på en gång."
      >
        <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-surface p-4">
          {radii.map((r) => (
            <Tile key={r.name} caption={r.name}>
              <div
                className={cn(
                  "size-20 border border-line-strong bg-surface-muted",
                  r.cls,
                )}
              />
            </Tile>
          ))}
        </div>
      </Section>

      <Section
        title="Skugga"
        description="Designsystemet är byggt på hårlinjer och luft – skuggorna ska knappt märkas."
      >
        <div className="flex flex-wrap gap-4 rounded-xl border border-line bg-canvas p-6">
          {shadows.map((s) => (
            <Tile key={s.name} caption={s.name}>
              <div
                className={cn("size-24 rounded-xl bg-surface", s.cls)}
              />
            </Tile>
          ))}
        </div>
      </Section>
    </div>
  );
}
