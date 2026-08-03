import { Plus, Printer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Group, Live, Section, Variant } from "../_components/kit";

/* ------------------------------------------------------------------ *
 *  Knappar – varje förslag renderas med exakt samma innehåll så det
 *  bara är formspråket som skiljer dem åt.
 * ------------------------------------------------------------------ */

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

/** Ett komplett prov: text+ikon, bara text, bara ikon och inaktiverad. */
function Sample({
  cls,
  full = "h-10 rounded-lg px-4",
  iconOnly = "size-10 rounded-lg",
}: {
  cls: string;
  full?: string;
  iconOnly?: string;
}) {
  return (
    <>
      <button className={cn(base, cls, full)}>
        <Plus />
        Ny arbetsorder
      </button>
      <button className={cn(base, cls, full)}>Spara</button>
      <button className={cn(base, cls, iconOnly)} aria-label="Skriv ut">
        <Printer />
      </button>
      <button className={cn(base, cls, full)} disabled>
        Inaktiv
      </button>
    </>
  );
}

const primaries: {
  label: string;
  name: string;
  note?: string;
  source?: string;
  cls: string;
}[] = [
    {
      label: "A",
      name: "Gradient (loggans fyllning)",
      note: "platt, utan djup",
      cls: "brand-fill hover:brightness-[1.03] focus-visible:ring-3 focus-visible:ring-ring/50",
    },
    {
      label: "B",
      name: "Platt orange",
      note: "lugnare, mer neutral",
      cls: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-ring/50",
    },
    {
      label: "C",
      name: "Upphöjd gradient",
      source: "components/ui/button.tsx · variant default",
      cls: "brand-fill border border-brand-700/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_2px_rgb(120_60_0/0.25),0_6px_14px_-8px_rgb(120_60_0/0.5)] hover:brightness-[1.04] active:shadow-[inset_0_1px_2px_rgb(120_60_0/0.35)]",
    },
    {
      label: "D",
      name: "Mjuk fyllnad",
      note: "diskret men färgad",
      cls: "bg-brand-500/12 text-brand-700 hover:bg-brand-500/20",
    },
    {
      label: "E",
      name: "Kontur",
      note: "sekundär känsla",
      cls: "border border-brand-600/45 bg-transparent text-brand-700 hover:bg-brand-500/10",
    },
    {
      label: "F",
      name: "Piller",
      note: "rundare formspråk",
      cls: "brand-fill !rounded-full",
    },
    {
      label: "G",
      name: "Bläck (mörk)",
      note: "neutral primär",
      cls: "bg-ink text-canvas hover:bg-ink/90",
    },
    {
      label: "H",
      name: "Kant + ljus fyllnad",
      note: "”nordisk” lågmäld",
      cls: "border border-line-strong bg-surface text-ink shadow-soft hover:border-brand-500/50 hover:text-brand-700",
    },
  ];

const secondaries: {
  label: string;
  name: string;
  source?: string;
  cls: string;
}[] = [
  {
    label: "A",
    name: "Upphöjd kontur",
    source: "components/ui/button.tsx · variant outline",
    // Exakt klasserna ur variant outline, så kortet visar sanningen.
    cls: "raised raised-press border border-line-strong bg-surface hover:bg-surface-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  },
  {
    label: "B",
    name: "Fylld grå",
    cls: "bg-surface-muted text-ink hover:bg-ink/[0.08]",
  },
  {
    label: "C",
    name: "Spöke",
    cls: "bg-transparent text-ink-soft hover:bg-ink/[0.06] hover:text-ink",
  },
  {
    label: "D",
    name: "Understruken länk",
    cls: "bg-transparent text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-brand-700 hover:decoration-brand-500",
  },
];

const destructives: {
  label: string;
  name: string;
  source?: string;
  cls: string;
}[] = [
  {
    label: "A",
    name: "Mjuk röd",
    source: "components/ui/button.tsx · variant destructive",
    cls: "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
  },
  {
    label: "B",
    name: "Fylld röd",
    cls: "bg-danger text-white hover:bg-danger/90",
  },
  {
    label: "C",
    name: "Kontur röd",
    cls: "border border-danger/40 bg-transparent text-danger hover:bg-danger/10",
  },
  {
    label: "D",
    name: "Grå tills hover",
    cls: "bg-transparent text-muted-foreground hover:bg-danger/10 hover:text-danger",
  },
];

export function ButtonsSection() {
  return (
    <div className="space-y-10">
      <Section
        title="Primärknapp"
        description="Den viktigaste knappen på varje vy – ”Ny arbetsorder”, ”Spara”, ”Klarmarkera”. Jämför fyllning, kant och djup."
      >
        <Group title="Förslag" cols={2}>
          {primaries.map((v) => (
            <Variant
              key={v.label}
              label={v.label}
              name={v.name}
              note={v.note}
              source={v.source}
            >
              <Sample cls={v.cls} />
            </Variant>
          ))}
        </Group>

        <Group title="Storlekar" cols={1}>
          <Live
            name="Button – alla storlekar"
            source="components/ui/button.tsx"
            className="items-end"
          >
            <Button size="xs">xs</Button>
            <Button size="sm">sm</Button>
            <Button size="default">default</Button>
            <Button size="lg">lg</Button>
            <Button size="md">md</Button>
            <Button size="icon-sm" aria-label="Lägg till">
              <Plus />
            </Button>
            <Button size="icon" aria-label="Lägg till">
              <Plus />
            </Button>
            <Button size="icon-md" aria-label="Lägg till">
              <Plus />
            </Button>
          </Live>
          <Live
            name="Button – alla varianter"
            source="components/ui/button.tsx · variant"
          >
            <Button>default</Button>
            <Button variant="outline">outline</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="destructive">destructive</Button>
            <Button variant="success">success</Button>
            <Button variant="link">link</Button>
          </Live>
        </Group>
      </Section>

      <Section
        title="Sekundärknapp"
        description="Står bredvid primärknappen – ”Avbryt”, ”Filtrera”, ”Exportera”. Ska synas utan att konkurrera."
      >
        <Group title="Förslag" cols={2}>
          {secondaries.map((v) => (
            <Variant
              key={v.label}
              label={v.label}
              name={v.name}
              source={v.source}
            >
              <Sample cls={v.cls} />
            </Variant>
          ))}
        </Group>
      </Section>

      <Section
        title="Farlig åtgärd"
        description="Radera fordon, ta bort kund. Ska kännas allvarlig men inte skrika på varje sida."
      >
        <Group title="Förslag" cols={2}>
          {destructives.map((v) => (
            <Variant
              key={v.label}
              label={v.label}
              name={v.name}
              source={v.source}
            >
              <button
                className={cn(base, v.cls, "h-10 rounded-lg px-4")}
                aria-label="Radera"
              >
                <Trash2 />
                Radera
              </button>
              <button
                className={cn(base, v.cls, "size-10 rounded-lg")}
                aria-label="Radera"
              >
                <Trash2 />
              </button>
            </Variant>
          ))}
        </Group>
      </Section>

      <Section
        title="Knappgrupp"
        description="Segmenterade kontroller för lägesval, t.ex. Dag / Vecka / Månad i planeringen."
      >
        <Group title="Förslag" cols={2}>
          {/* Exakt klasserna ur schedule-calendar.tsx: spår i surface-muted
              med hårlinje runt, aktivt läge som vitt kort med ring. */}
          <Variant
            label="A"
            name="Vitt kort i spår"
            source="planering/schedule-calendar.tsx · arbetsordrar/orders-view.tsx"
          >
            <div className="inset-track inline-flex h-10 rounded-xl border border-line bg-surface-muted p-0.5">
              {["Dag", "Vecka"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "inline-flex items-center rounded-lg px-4 text-sm font-semibold transition-all",
                    i === 1
                      ? "raised bg-surface text-ink ring-1 ring-line-strong"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Variant>
          <Variant label="B" name="Sammanfogad kontur">
            <div className="inline-flex overflow-hidden rounded-lg border border-line-strong">
              {["Dag", "Vecka", "Månad"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "h-10 px-4 text-sm font-medium transition-colors",
                    i > 0 && "border-l border-line-strong",
                    i === 1
                      ? "bg-brand-500/12 text-brand-700"
                      : "bg-surface text-ink-soft hover:bg-surface-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Variant>
          <Variant label="C" name="Flytande markör i spår">
            <div className="inline-flex gap-1 rounded-full bg-surface-muted p-1">
              {["Dag", "Vecka", "Månad"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "h-8 rounded-full px-4 text-sm font-medium transition-colors",
                    i === 1
                      ? "bg-surface text-ink shadow-card"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Variant>
          <Variant label="D" name="Mörk markör">
            <div className="inline-flex gap-1 rounded-lg bg-surface-muted p-1">
              {["Dag", "Vecka", "Månad"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "h-8 rounded-md px-4 text-sm font-medium transition-colors",
                    i === 1
                      ? "bg-ink text-canvas"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Variant>
          <Variant label="E" name="Understruken">
            <div className="inline-flex gap-5 border-b border-line">
              {["Dag", "Vecka", "Månad"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "-mb-px border-b-2 pb-2 text-sm font-medium transition-colors",
                    i === 1
                      ? "border-brand-600 text-ink"
                      : "border-transparent text-muted-foreground hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Variant>
        </Group>
      </Section>
    </div>
  );
}
