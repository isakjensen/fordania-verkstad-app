import { Check, Clock, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { Group, Live, Section, Variant } from "../_components/kit";

/* ------------------------------------------------------------------ *
 *  Statusmärken – arbetsorderns status är det öga söker först i varje
 *  lista, så formen betyder mycket.
 * ------------------------------------------------------------------ */

/** De fyra statusar appen faktiskt visar, med sin färgroll. */
const statuses = [
  { text: "Planerad", tone: "info" },
  { text: "Pågår", tone: "warning" },
  { text: "Klar", tone: "success" },
  { text: "Försenad", tone: "danger" },
] as const;

type Tone = (typeof statuses)[number]["tone"];

const soft: Record<Tone, string> = {
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

const solid: Record<Tone, string> = {
  info: "bg-info text-white",
  warning: "bg-warning text-white",
  success: "bg-success text-white",
  danger: "bg-danger text-white",
};

const dot: Record<Tone, string> = {
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
  danger: "bg-danger",
};

const outline: Record<Tone, string> = {
  info: "border-info/40 text-info",
  warning: "border-warning/40 text-warning",
  success: "border-success/40 text-success",
  danger: "border-danger/40 text-danger",
};

/** Exakt statusMeta.badge ur planering/calendar-meta.ts – det som körs live. */
const liveBadge: Record<Tone, string> = {
  info: "bg-surface text-info ring-1 ring-inset ring-info/40 dark:bg-info-soft/50",
  warning:
    "bg-surface text-warning ring-1 ring-inset ring-warning/40 dark:bg-warning-soft/50",
  success:
    "bg-surface text-success ring-1 ring-inset ring-success/40 dark:bg-success-soft/50",
  danger:
    "bg-surface text-danger ring-1 ring-inset ring-danger/40 dark:bg-danger-soft/50",
};

export function StatusSection() {
  return (
    <div className="space-y-10">
      <Section
        title="Statusmärken"
        description="Samma fyra statusar i sex formspråk. Titta särskilt på hur de känns i en tät lista – de ska gå att skanna, inte lysa."
      >
        <Group title="Förslag" cols={2}>
          <Variant
            label="A"
            name="Vit yta, färgad ring och prick"
            source="planering/calendar-meta.ts · statusMeta.badge"
          >
            {statuses.map((s) => (
              <span
                key={s.text}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  liveBadge[s.tone],
                )}
              >
                <span className={cn("size-1.5 rounded-full", dot[s.tone])} />
                {s.text}
              </span>
            ))}
          </Variant>
          <Variant label="B" name="Mjuk fyllnad, piller">
            {statuses.map((s) => (
              <span
                key={s.text}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  soft[s.tone],
                )}
              >
                {s.text}
              </span>
            ))}
          </Variant>
          <Variant label="C" name="Mjuk fyllnad med prick">
            {statuses.map((s) => (
              <span
                key={s.text}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  soft[s.tone],
                )}
              >
                <span className={cn("size-1.5 rounded-full", dot[s.tone])} />
                {s.text}
              </span>
            ))}
          </Variant>
          <Variant label="D" name="Fylld, hög kontrast">
            {statuses.map((s) => (
              <span
                key={s.text}
                className={cn(
                  "rounded-md px-2 py-1 text-[0.7rem] font-semibold tracking-wide uppercase",
                  solid[s.tone],
                )}
              >
                {s.text}
              </span>
            ))}
          </Variant>
          <Variant label="E" name="Kontur">
            {statuses.map((s) => (
              <span
                key={s.text}
                className={cn(
                  "rounded-full border bg-transparent px-2.5 py-1 text-xs font-medium",
                  outline[s.tone],
                )}
              >
                {s.text}
              </span>
            ))}
          </Variant>
          <Variant label="F" name="Bara prick + text" note="tystast">
            {statuses.map((s) => (
              <span
                key={s.text}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft"
              >
                <span className={cn("size-2 rounded-full", dot[s.tone])} />
                {s.text}
              </span>
            ))}
          </Variant>
          <Variant label="G" name="Vänsterribba">
            {statuses.map((s) => (
              <span
                key={s.text}
                className={cn(
                  "inline-flex items-center gap-2 rounded-r-md border-l-2 py-1 pr-2.5 pl-2 text-xs font-medium",
                  soft[s.tone],
                  s.tone === "info" && "border-info",
                  s.tone === "warning" && "border-warning",
                  s.tone === "success" && "border-success",
                  s.tone === "danger" && "border-danger",
                )}
              >
                {s.text}
              </span>
            ))}
          </Variant>
        </Group>

        <Group title="Komponenten som körs" cols={1}>
          <Live name="Badge" source="components/ui/badge.tsx">
            <Badge className="bg-info-soft text-info">Planerad</Badge>
            <Badge className="bg-warning-soft text-warning" dot="bg-warning">
              Pågår
            </Badge>
            <Badge className="bg-success-soft text-success">Klar</Badge>
            <Badge className="bg-danger-soft text-danger">Försenad</Badge>
          </Live>
        </Group>
      </Section>

      <Section
        title="Räknare och nyckeltal"
        description="Siffror i toppen av dagens uppdrag och på planeringssidan."
      >
        <Group title="Förslag" cols={3}>
          {/* Måtten är hämtade rakt ur StatCard, så kortet är detsamma som på
              översikten och dagens uppdrag. */}
          <Variant
            label="A"
            name="Stor siffra, tyst etikett"
            source="components/dashboard/stat-card.tsx"
            className="p-0"
          >
            <div className="w-full rounded-xl border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Öppna ordrar
                </p>
                <Wrench
                  className="size-[1.1rem] shrink-0 text-muted-foreground/70"
                  strokeWidth={1.5}
                />
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">
                  24
                </span>
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">
                +3 sedan i går
              </p>
            </div>
          </Variant>
          <Variant label="B" name="Ikonchip till vänster" className="p-0">
            <div className="flex w-full items-center gap-4 rounded-xl border border-line bg-surface p-5">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700">
                <Clock className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-ink">24</p>
                <p className="text-xs text-muted-foreground">Öppna ordrar</p>
              </div>
            </div>
          </Variant>
          <Variant label="C" name="Toppribba i färg" className="p-0">
            <div className="w-full overflow-hidden rounded-xl border border-line bg-surface">
              <div className="h-1 brand-fill" />
              <div className="p-5">
                <p className="text-2xl font-semibold text-ink">24</p>
                <p className="mt-1 text-xs text-muted-foreground">Öppna ordrar</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-success">
                  <Check className="size-3.5" /> 8 klara i dag
                </p>
              </div>
            </div>
          </Variant>
        </Group>
      </Section>
    </div>
  );
}
