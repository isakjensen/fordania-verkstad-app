import {
  AlertTriangle,
  CheckCircle2,
  Car,
  Info,
  WifiOff,
  Loader2,
  PackageSearch,
  Plus,
  X,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { Group, Section, Variant } from "../_components/kit";

/* ------------------------------------------------------------------ *
 *  Återkoppling: notiser, banderoller, tomma lägen och laddning.
 * ------------------------------------------------------------------ */

export function FeedbackSection() {
  return (
    <div className="space-y-10">
      <Section
        title="Notiser"
        description="Kvittot efter en sparning eller ett fel. Dyker upp i hörnet och försvinner igen."
      >
        <Group
          title="Förslag"
          hint="appen har inga notiser i dag – inget av förslagen är live"
          cols={2}
        >
          <Variant label="A" name="Vit med färgad ikon" className="p-0">
            <div className="m-4 flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-lift">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">Arbetsorder sparad</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  #1042 uppdaterades klockan 14:32.
                </p>
              </div>
              <X className="size-4 shrink-0 text-muted-foreground" />
            </div>
          </Variant>
          <Variant label="B" name="Tonad i statusfärg" className="p-0">
            <div className="m-4 flex w-full items-start gap-3 rounded-xl border border-success/25 bg-success-soft p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-success">
                  Arbetsorder sparad
                </p>
                <p className="mt-0.5 text-xs text-success/80">
                  #1042 uppdaterades klockan 14:32.
                </p>
              </div>
            </div>
          </Variant>
          <Variant label="C" name="Mörk, kompakt" className="p-0">
            <div className="m-4 flex w-full items-center gap-3 rounded-full bg-ink px-4 py-2.5 shadow-lift">
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-canvas">
                Arbetsorder sparad
              </p>
              <button className="text-xs font-semibold text-canvas/70 hover:text-canvas">
                Ångra
              </button>
            </div>
          </Variant>
          <Variant label="D" name="Vänsterribba" className="p-0">
            <div className="m-4 flex w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
              <span className="w-1 shrink-0 bg-danger" />
              <div className="flex-1 p-4">
                <p className="text-sm font-medium text-ink">
                  Kunde inte spara ändringen
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Kontrollera nätverket och försök igen.
                </p>
              </div>
            </div>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Banderoller"
        description="Stationär information i en vy – t.ex. att appen är offline eller att fordonet har en öppen anmärkning."
      >
        <Group title="Förslag" cols={1}>
          {/* Offline-baren högst upp i appen – enda banderollen som finns i dag. */}
          <Variant
            label="A"
            name="Helbred, fylld varningsfärg"
            source="components/pwa/pwa-manager.tsx"
            className="p-0"
          >
            <div className="w-full">
              <div className="flex w-full items-center justify-center gap-2 bg-warning px-3 py-2 text-center text-[0.8rem] font-semibold text-white">
                <WifiOff className="size-4 shrink-0" />
                Offline – visar sparad information
                <Info className="size-3.5 shrink-0 opacity-80" />
              </div>
            </div>
          </Variant>
          <Variant label="B" name="Tonad med ikon" className="p-0">
            <div className="w-full space-y-3 p-4">
              {[
                { icon: Info, tone: "info", text: "Fordonet är avställt sedan 12 juni." },
                {
                  icon: AlertTriangle,
                  tone: "warning",
                  text: "Besiktningen går ut om 14 dagar.",
                },
                {
                  icon: AlertTriangle,
                  tone: "danger",
                  text: "Arbetsordern är försenad två dagar.",
                },
              ].map((b) => (
                <div
                  key={b.tone}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm",
                    b.tone === "info" && "bg-info-soft text-info",
                    b.tone === "warning" && "bg-warning-soft text-warning",
                    b.tone === "danger" && "bg-danger-soft text-danger",
                  )}
                >
                  <b.icon className="size-4 shrink-0" />
                  <span className="font-medium">{b.text}</span>
                </div>
              ))}
            </div>
          </Variant>
          <Variant label="C" name="Kontur med vänsterribba" className="p-0">
            <div className="w-full space-y-3 p-4">
              {[
                { tone: "info", text: "Fordonet är avställt sedan 12 juni." },
                { tone: "warning", text: "Besiktningen går ut om 14 dagar." },
              ].map((b) => (
                <div
                  key={b.tone}
                  className="flex overflow-hidden rounded-lg border border-line bg-surface"
                >
                  <span
                    className={cn(
                      "w-1 shrink-0",
                      b.tone === "info" ? "bg-info" : "bg-warning",
                    )}
                  />
                  <p className="flex-1 px-4 py-3 text-sm text-ink-soft">
                    {b.text}
                  </p>
                </div>
              ))}
            </div>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Tomt läge"
        description="Vad användaren möts av innan det finns data – ofta första intrycket av en ny verkstad."
      >
        <Group title="Förslag" cols={3}>
          {/* Exakt tomläget ur fordon/kunder/användare-sidorna. */}
          <Variant
            label="A"
            name="Ikon i rundad fyrkant"
            source="fordon/page.tsx · kunder/page.tsx"
            className="p-0"
          >
            <div className="flex w-full flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:text-ink-soft">
                <Car className="size-6" />
              </span>
              <p className="mt-4 font-semibold text-ink">Inga fordon ännu</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Klicka på ”Lägg till fordon” för att registrera ditt första
                fordon.
              </p>
            </div>
          </Variant>
          <Variant label="B" name="Ikon i cirkel med knapp" className="p-0">
            <div className="w-full px-6 py-10 text-center">
              <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
                <PackageSearch className="size-6" />
              </span>
              <p className="mt-4 text-sm font-medium text-ink">
                Inga arbetsordrar än
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                Skapa den första så dyker den upp här.
              </p>
              <button className="brand-fill mt-5 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium">
                <Plus className="size-4" />
                Ny arbetsorder
              </button>
            </div>
          </Variant>
          <Variant label="C" name="Streckad ruta" className="p-0">
            <div className="m-4 w-full rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
              <p className="text-sm font-medium text-ink">
                Inga arbetsordrar än
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Skapa den första så dyker den upp här.
              </p>
              <button className="mt-4 text-sm font-semibold text-brand-700 hover:underline">
                Ny arbetsorder
              </button>
            </div>
          </Variant>
          <Variant label="D" name="Radlöst, tyst" className="p-0">
            <div className="w-full px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Inga arbetsordrar matchar din sökning.
              </p>
            </div>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Laddning"
        description="Vad som visas medan data hämtas. Skelett håller layouten still, spinnare är enklare."
      >
        <Group title="Förslag" cols={3}>
          <Variant label="A" name="Skelett" source="components/ui/skeleton.tsx" className="p-0">
            <div className="w-full space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-40 max-w-full" />
                    <Skeleton className="mt-1.5 h-3 w-56 max-w-full" />
                  </div>
                  <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
                </div>
              ))}
            </div>
          </Variant>
          <Variant label="B" name="Spinnare" className="p-0">
            <div className="flex w-full flex-col items-center gap-3 py-12">
              <Loader2 className="size-6 animate-spin text-brand-600" />
              <p className="text-xs text-muted-foreground">Hämtar arbetsordrar…</p>
            </div>
          </Variant>
          <Variant label="C" name="Framstegsrad i toppen" className="p-0">
            <div className="w-full">
              <div className="h-0.5 w-full overflow-hidden bg-surface-muted">
                <div className="h-full w-2/5 brand-fill" />
              </div>
              <div className="space-y-2 p-4 opacity-50">
                <div className="h-3.5 w-40 rounded bg-ink/[0.08]" />
                <div className="h-3 w-56 rounded bg-ink/[0.08]" />
                <div className="h-3 w-48 rounded bg-ink/[0.08]" />
              </div>
            </div>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Dialogruta"
        description="Bekräftelser och små formulär ovanpå vyn."
      >
        <Group title="Förslag" cols={2}>
          <Variant label="A" name="Avdelad sidfot" source="components/ui/dialog.tsx" className="p-0">
            <div className="m-4 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
              <div className="px-5 py-4">
                <h4 className="text-[0.95rem] font-semibold text-ink">
                  Radera fordon?
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  ABC 123 och dess historik tas bort permanent.
                </p>
              </div>
              <div className="flex justify-end gap-2 border-t border-line bg-surface-muted px-5 py-3">
                <button className="h-9 rounded-lg px-3 text-sm font-medium text-ink-soft hover:bg-ink/[0.06]">
                  Avbryt
                </button>
                <button className="h-9 rounded-lg bg-danger px-3 text-sm font-medium text-white hover:bg-danger/90">
                  Radera
                </button>
              </div>
            </div>
          </Variant>
          <Variant label="B" name="Ikon överst, centrerad" className="p-0">
            <div className="m-4 w-full overflow-hidden rounded-2xl border border-line bg-surface p-6 text-center shadow-lift">
              <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
                <AlertTriangle className="size-5" />
              </span>
              <h4 className="mt-4 text-[0.95rem] font-semibold text-ink">
                Radera fordon?
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                ABC 123 och dess historik tas bort permanent.
              </p>
              <div className="mt-5 flex gap-2">
                <button className="h-10 flex-1 rounded-lg border border-line-strong text-sm font-medium text-ink hover:bg-surface-muted">
                  Avbryt
                </button>
                <button className="h-10 flex-1 rounded-lg bg-danger text-sm font-medium text-white hover:bg-danger/90">
                  Radera
                </button>
              </div>
            </div>
          </Variant>
        </Group>
      </Section>
    </div>
  );
}
