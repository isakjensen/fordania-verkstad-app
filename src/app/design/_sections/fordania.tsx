import {
  CalendarDays,
  Car,
  ChevronRight,
  Clock,
  Gauge,
  User,
  Wrench,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { LicensePlate } from "@/components/ui/license-plate";
import { cn } from "@/lib/utils";

import { Group, Live, Section, Tile, Variant } from "../_components/kit";
import {
  DesignPlate,
  plateCurrent,
  plateDark,
  plateEmbossed,
  plateFlat,
  plateMatte,
  plateSquare,
  plateSoftGloss,
} from "./plate-variants";

/** Visar ett skyltförslag i alla tre storlekar bredvid varandra. */
function PlateSet({ style }: { style: Parameters<typeof DesignPlate>[0]["style"] }) {
  return (
    <>
      <Tile caption="sm">
        <DesignPlate style={style} size="sm" />
      </Tile>
      <Tile caption="md">
        <DesignPlate style={style} size="md" />
      </Tile>
      <Tile caption="lg">
        <DesignPlate style={style} size="lg" />
      </Tile>
    </>
  );
}

/* ------------------------------------------------------------------ *
 *  Verkstadens egna byggblock: registreringsskylt, fordonskort och
 *  orderkortet som ligger i planeringens kalender.
 * ------------------------------------------------------------------ */

export function FordaniaSection() {
  return (
    <div className="space-y-10">
      <Section
        title="Registreringsskylt"
        description="Appens starkaste igenkänningstecken. Den riktiga komponenten först – förslagen under är lättare varianter för täta listor."
      >
        <Group title="Komponenten som körs" cols={1}>
          <Live
            name="LicensePlate"
            source="components/ui/license-plate.tsx"
          >
            <Tile caption="sm">
              <LicensePlate value="ABC123" size="sm" />
            </Tile>
            <Tile caption="md">
              <LicensePlate value="ABC123" size="md" />
            </Tile>
            <Tile caption="lg">
              <LicensePlate value="ABC123" size="lg" />
            </Tile>
          </Live>
        </Group>
        <Group
          title="Omgjord skylt"
          hint="samma skylt, olika mycket gradient och djup – varje ruta visar sm/md/lg"
          cols={2}
        >
          <Variant
            label="A"
            name="Gradient i band, yta och glans"
            note="tidigare live"
            className="items-end"
          >
            <PlateSet style={plateCurrent} />
          </Variant>
          <Variant
            label="B"
            name="Nedtonad gradient"
            source="components/ui/license-plate.tsx"
            className="items-end"
          >
            <PlateSet style={plateFlat} />
          </Variant>
          <Variant
            label="C"
            name="Helt matt"
            note="ingen gradient, ingen skugga"
            className="items-end"
          >
            <PlateSet style={plateMatte} />
          </Variant>
          <Variant
            label="D"
            name="Platt yta, kvar topp-glans"
            note="mellanläge mot A"
            className="items-end"
          >
            <PlateSet style={plateSoftGloss} />
          </Variant>
          <Variant
            label="E"
            name="Präglade tecken"
            note="djupet ligger i texten"
            className="items-end"
          >
            <PlateSet style={plateEmbossed} />
          </Variant>
          <Variant
            label="F"
            name="Kantig"
            note="2 px radie, hårdare uttryck"
            className="items-end"
          >
            <PlateSet style={plateSquare} />
          </Variant>
          <Variant
            label="G"
            name="Mörk platta"
            note="alternativ enbart för mörkt läge"
            className="items-end"
          >
            <PlateSet style={plateDark} />
          </Variant>
        </Group>

        <Group title="Lättare alternativ" hint="för tabeller och tighta rader" cols={3}>
          <Variant label="A" name="Mono-text">
            <span className="font-mono text-sm font-bold tracking-[0.06em] text-ink">
              ABC 123
            </span>
          </Variant>
          <Variant label="B" name="Mono i chip">
            <span className="rounded-md border border-line-strong bg-surface-muted px-2 py-1 font-mono text-sm font-bold tracking-[0.06em] text-ink">
              ABC 123
            </span>
          </Variant>
          <Variant label="C" name="Med blå EU-kant">
            <span className="inline-flex overflow-hidden rounded-md border border-line-strong">
              <span className="w-1.5 bg-[#0d54cc]" />
              <span className="bg-surface px-2 py-1 font-mono text-sm font-bold tracking-[0.06em] text-ink">
                ABC 123
              </span>
            </span>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Fordonskort"
        description="Så här möter man ett fordon i listan eller på översikten."
      >
        <Group title="Förslag" cols={2}>
          <Variant label="A" name="Skylt överst" className="p-0">
            <div className="w-full rounded-xl border border-line bg-surface p-4">
              <LicensePlate value="ABC123" size="md" />
              <p className="mt-3 text-[0.95rem] font-semibold text-ink">
                Volvo V60
              </p>
              <p className="text-xs text-muted-foreground">2021 · 84 300 km</p>
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted-foreground">
                <Wrench className="size-3.5" />
                Senaste service 12 maj
              </div>
            </div>
          </Variant>
          <Variant label="B" name="Skylt till höger" className="p-0">
            <div className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-soft">
                <Car className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.95rem] font-semibold text-ink">
                  Volvo V60
                </p>
                <p className="text-xs text-muted-foreground">2021 · 84 300 km</p>
              </div>
              <LicensePlate value="ABC123" size="sm" />
            </div>
          </Variant>
          <Variant label="C" name="Med statusribba" className="p-0">
            <div className="w-full overflow-hidden rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between bg-warning-soft px-4 py-2">
                <span className="text-xs font-semibold text-warning">
                  På verkstad
                </span>
                <span className="text-xs text-warning">Plats 3</span>
              </div>
              <div className="flex items-center gap-3 p-4">
                <LicensePlate value="ABC123" size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">Volvo V60</p>
                  <p className="text-xs text-muted-foreground">2021</p>
                </div>
              </div>
            </div>
          </Variant>
          {/* Raden som verkligen ligger i fordonslistan: skylt först, namn,
              mätarställning och en chevron till höger. */}
          <Variant
            label="D"
            name="Listrad med skylt först"
            source="fordon/vehicles-view.tsx"
            className="p-0"
          >
            <div className="flex w-full items-center gap-2.5 border-b border-line bg-surface px-4 py-3.5">
              <LicensePlate value="ABC123" className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.95rem] font-semibold text-ink">
                  Volvo V60
                </span>
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                  <Gauge className="size-3.5" />
                  84 300 km
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
            </div>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Orderkort i kalendern"
        description="Kortet som dras och släpps i planeringen. Det ska tåla att bli smalt och ändå gå att läsa."
      >
        <Group title="Förslag" cols={3}>
          {/* Live-kortet färgas efter ORDERTYP (Service = blå, Reparation =
              gul …), inte efter status. Statusen bärs av den lilla pricken. */}
          <Variant
            label="A"
            name="Typfärgad ton + ring"
            source="planering/event-card.tsx · calendar-meta.ts"
            className="p-0"
          >
            <div className="w-full space-y-2 p-4">
              {[
                {
                  type: "Service",
                  tint: "bg-sky-50 dark:bg-sky-500/10",
                  ring: "ring-sky-200/50 dark:ring-sky-500/15",
                  icon: "text-sky-600 dark:text-sky-400",
                  dot: "bg-info",
                },
                {
                  type: "Reparation",
                  tint: "bg-amber-50 dark:bg-amber-500/10",
                  ring: "ring-amber-200/50 dark:ring-amber-500/15",
                  icon: "text-amber-600 dark:text-amber-400",
                  dot: "bg-warning",
                },
              ].map((t) => (
                <div
                  key={t.type}
                  className={cn(
                    "flex overflow-hidden rounded-md ring-1",
                    t.tint,
                    t.ring,
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-1">
                    <span className="flex items-center gap-1.5">
                      <Wrench className={cn("size-3 shrink-0", t.icon)} />
                      <span className="min-w-0 flex-1 truncate text-[0.8rem] leading-tight font-semibold tracking-tight text-ink">
                        {t.type}
                      </span>
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          t.dot,
                        )}
                      />
                    </span>
                    <span className="truncate text-[0.66rem] leading-tight font-medium text-muted-foreground tabular-nums">
                      08:00–10:00
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Variant>
          <Variant label="B" name="Statusprick" className="p-0">
            <div className="m-4 w-full rounded-lg border border-line bg-surface p-3 shadow-chip">
              <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full bg-warning" />
                <span className="truncate font-mono text-xs font-bold text-ink">
                  ABC 123
                </span>
              </div>
              <p className="mt-1.5 truncate text-xs text-ink-soft">
                Service 10 000 km
              </p>
              <div className="mt-2 flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                <Clock className="size-3" />
                08:00–10:00
              </div>
            </div>
          </Variant>
          <Variant label="C" name="Färgad vänsterkant" className="p-0">
            <div className="m-4 flex w-full overflow-hidden rounded-lg bg-surface shadow-chip">
              <span className="w-1 shrink-0 bg-warning" />
              <div className="min-w-0 flex-1 p-3">
                <span className="block truncate font-mono text-xs font-bold text-ink">
                  ABC 123
                </span>
                <p className="mt-1 truncate text-xs text-ink-soft">
                  Service 10 000 km
                </p>
                <div className="mt-2 flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                  <User className="size-3" />
                  Marcus
                </div>
              </div>
            </div>
          </Variant>
          <Variant label="D" name="Helt tonat kort" className="p-0">
            <div className="m-4 w-full rounded-lg border border-warning/25 bg-warning-soft p-3">
              <span className="block truncate font-mono text-xs font-bold text-warning">
                ABC 123
              </span>
              <p className="mt-1 truncate text-xs text-warning/90">
                Service 10 000 km
              </p>
              <div className="mt-2 flex items-center gap-1 text-[0.7rem] text-warning/80">
                <CalendarDays className="size-3" />
                Tors 08:00
              </div>
            </div>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Mekaniker"
        description="Vem som är tilldelad ett jobb. I listorna står namnen som ren text i dag – Avatar används i menyn och på användarsidan."
      >
        <Group title="Komponenten som körs" cols={1}>
          <Live name="Avatar" source="components/ui/avatar.tsx">
            <Avatar initials="MA" />
            <Avatar initials="SB" />
            <Avatar initials="AL" size="size-11 text-sm" />
            <span className="text-sm text-muted-foreground">
              Färgen sätts av initialerna.
            </span>
          </Live>
        </Group>
        <Group
          title="Förslag"
          hint="för listor och kalenderkort – inget av dem är live än"
          cols={3}
        >
          {[
            { label: "A", name: "Initialer i cirkel" },
            { label: "B", name: "Initialer + namn" },
            { label: "C", name: "Chip med kant" },
          ].map((v) => (
            <Variant key={v.label} label={v.label} name={v.name}>
              {v.label === "A" ? (
                <div className="flex -space-x-2">
                  {["MA", "SB", "AL"].map((i, n) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-full border-2 border-surface text-xs font-semibold",
                        n === 0 && "bg-brand-500/15 text-brand-700",
                        n === 1 && "bg-info-soft text-info",
                        n === 2 && "bg-success-soft text-success",
                      )}
                    >
                      {i}
                    </span>
                  ))}
                </div>
              ) : v.label === "B" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-700">
                    MA
                  </span>
                  <span className="text-sm text-ink">Marcus Andersson</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface py-1 pr-3 pl-1">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-muted text-[0.65rem] font-semibold text-ink-soft">
                    MA
                  </span>
                  <span className="text-xs font-medium text-ink">Marcus</span>
                </span>
              )}
            </Variant>
          ))}
        </Group>
      </Section>
    </div>
  );
}
