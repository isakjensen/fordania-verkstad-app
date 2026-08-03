import { ChevronRight, MoreHorizontal, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { Group, Live, Section, Variant } from "../_components/kit";

/* ------------------------------------------------------------------ *
 *  Ytor: kort, paneler och listrader.
 * ------------------------------------------------------------------ */

function CardContent() {
  return (
    <>
      <p className="text-sm text-ink-soft">
        Service 10 000 km, kontroll av bromsar och byte av torkarblad.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">Tilldelad Marcus · 2 h beräknat</p>
    </>
  );
}

const rows = [
  { plate: "ABC 123", model: "Volvo V60", who: "Marcus", tone: "warning" },
  { plate: "XYZ 789", model: "Toyota Corolla", who: "Sara", tone: "info" },
  { plate: "JKL 456", model: "VW Transporter", who: "Ali", tone: "success" },
] as const;

const toneBg = {
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
};

const toneText = { warning: "Pågår", info: "Planerad", success: "Klar" };

export function SurfacesSection() {
  return (
    <div className="space-y-10">
      <Section
        title="Kort"
        description="Bäraren av allt innehåll i appen. Skillnaden ligger i kant, skugga och hur rubriken avdelas."
      >
        <Group title="Förslag" cols={2}>
          <Variant
            label="A"
            name="Hårlinje, ingen skugga"
            source="components/ui/card.tsx"
            className="p-0"
          >
            <div className="w-full overflow-hidden rounded-xl border border-line bg-surface">
              <div className="border-b border-line px-5 py-4">
                <h4 className="text-[0.95rem] font-semibold text-ink">
                  Arbetsorder #1042
                </h4>
                <p className="mt-0.5 text-sm text-muted-foreground">ABC 123 · Volvo V60</p>
              </div>
              <div className="px-5 py-4">
                <CardContent />
              </div>
            </div>
          </Variant>
          <Variant label="B" name="Mjuk skugga, ingen kant" className="p-0">
            <div className="w-full overflow-hidden rounded-xl bg-surface shadow-lift">
              <div className="px-5 py-4">
                <h4 className="text-[0.95rem] font-semibold text-ink">
                  Arbetsorder #1042
                </h4>
                <p className="mt-0.5 text-sm text-muted-foreground">ABC 123 · Volvo V60</p>
              </div>
              <div className="px-5 pb-5">
                <CardContent />
              </div>
            </div>
          </Variant>
          <Variant label="C" name="Tonad rubrikrad" className="p-0">
            <div className="w-full overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line bg-surface-muted px-5 py-3">
                <h4 className="text-[0.95rem] font-semibold text-ink">
                  Arbetsorder #1042
                </h4>
                <button className="text-muted-foreground hover:text-ink">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
              <div className="px-5 py-4">
                <CardContent />
              </div>
            </div>
          </Variant>
          <Variant label="D" name="Kantribba i status­färg" className="p-0">
            <div className="flex w-full overflow-hidden rounded-xl border border-line bg-surface">
              <div className="w-1 shrink-0 bg-warning" />
              <div className="min-w-0 flex-1 px-5 py-4">
                <h4 className="text-[0.95rem] font-semibold text-ink">
                  Arbetsorder #1042
                </h4>
                <p className="mt-0.5 text-sm text-muted-foreground">ABC 123 · Volvo V60</p>
                <div className="mt-3">
                  <CardContent />
                </div>
              </div>
            </div>
          </Variant>
          <Variant label="E" name="Rundare, luftigare" className="p-0">
            <div className="w-full overflow-hidden rounded-3xl border border-line bg-surface p-7">
              <h4 className="text-base font-semibold text-ink">
                Arbetsorder #1042
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">ABC 123 · Volvo V60</p>
              <div className="mt-4">
                <CardContent />
              </div>
            </div>
          </Variant>
          <Variant label="F" name="Klickbart kort" note="hela ytan är knapp" className="p-0">
            <button className="group w-full overflow-hidden rounded-xl border border-line bg-surface text-left transition-all hover:border-brand-500/50 hover:shadow-lift">
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-500/12 text-brand-700">
                  <Wrench className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[0.95rem] font-semibold text-ink">
                    Arbetsorder #1042
                  </h4>
                  <p className="text-sm text-muted-foreground">ABC 123 · Volvo V60</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" />
              </div>
            </button>
          </Variant>
        </Group>

        <Group title="Komponenten som körs" cols={1}>
          <Live
            name="Card + CardHeader + CardBody"
            source="components/ui/card.tsx"
            className="p-0"
          >
            <Card className="w-full">
              <CardHeader
                title="Arbetsorder #1042"
                subtitle="ABC 123 · Volvo V60"
                action={<Button size="sm">Öppna</Button>}
              />
              <CardBody className="pt-4">
                <CardContent />
              </CardBody>
            </Card>
          </Live>
        </Group>
      </Section>

      <Section
        title="Listrader"
        description="Fordonslistan, kundlistan och orderlistan delar samma radmönster. Täthet och avgränsning är det som skiljer."
      >
        <Group title="Förslag" cols={2}>
          <Variant
            label="A"
            name="Delande hårlinjer"
            source="arbetsordrar/order-rows.tsx · fordon/vehicles-view.tsx"
            className="p-0"
          >
            <ul className="w-full divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {rows.map((r) => (
                <li
                  key={r.plate}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{r.plate}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.model} · {r.who}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      toneBg[r.tone],
                    )}
                  >
                    {toneText[r.tone]}
                  </span>
                </li>
              ))}
            </ul>
          </Variant>
          <Variant label="B" name="Fristående radkort" className="p-0">
            <ul className="w-full space-y-2">
              {rows.map((r) => (
                <li
                  key={r.plate}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-shadow hover:shadow-lift"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{r.plate}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.model} · {r.who}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      toneBg[r.tone],
                    )}
                  >
                    {toneText[r.tone]}
                  </span>
                </li>
              ))}
            </ul>
          </Variant>
          <Variant label="C" name="Zebrarader, tät" className="p-0">
            <ul className="w-full overflow-hidden rounded-xl border border-line bg-surface">
              {rows.map((r, i) => (
                <li
                  key={r.plate}
                  className={cn(
                    "flex items-center gap-3 px-5 py-2",
                    i % 2 === 1 && "bg-surface-muted",
                  )}
                >
                  <span className="w-24 shrink-0 font-mono text-sm font-medium text-ink">
                    {r.plate}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                    {r.model}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.who}</span>
                </li>
              ))}
            </ul>
          </Variant>
          <Variant label="D" name="Med ikonchip" className="p-0">
            <ul className="w-full divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {rows.map((r) => (
                <li
                  key={r.plate}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-soft">
                    <Wrench className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{r.plate}</p>
                    <p className="text-xs text-muted-foreground">{r.model}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </Variant>
        </Group>
      </Section>
    </div>
  );
}
