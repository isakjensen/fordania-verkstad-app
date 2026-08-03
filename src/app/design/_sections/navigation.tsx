import {
  CalendarDays,
  Car,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  ScanLine,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Group, Section, Variant } from "../_components/kit";

/* ------------------------------------------------------------------ *
 *  Navigering: sidomeny, flikar, brödsmulor och flikfält på mobil.
 * ------------------------------------------------------------------ */

const nav = [
  { text: "Översikt", icon: LayoutDashboard },
  { text: "Arbetsordrar", icon: ClipboardList },
  { text: "Planering", icon: CalendarDays },
  { text: "Fordon", icon: Car },
  { text: "Kunder", icon: Users },
];

function Sidebar({
  active,
  itemCls,
  activeCls,
}: {
  active: number;
  itemCls: string;
  activeCls: string;
}) {
  return (
    <nav className="w-full max-w-56 space-y-1">
      {nav.map((n, i) => (
        <a
          key={n.text}
          className={cn(
            "flex items-center gap-3 text-sm font-medium transition-colors",
            itemCls,
            i === active ? activeCls : "text-ink-soft hover:bg-surface-muted",
          )}
        >
          <n.icon className="size-[1.05rem] shrink-0" />
          {n.text}
        </a>
      ))}
    </nav>
  );
}

/**
 * Sidomenyn som faktiskt körs: varm gradientyta, aktivt läge som vitt kort
 * med ring och en orange accentstapel längst till vänster.
 */
function LiveSidebar() {
  return (
    <div className="w-full max-w-60 rounded-lg bg-linear-to-b from-[#fff1e4] via-[#fff9f4] to-white p-3 dark:from-[#1c1813] dark:via-[#151311] dark:to-[#100f0d]">
      <p className="mb-1 px-2.5 text-[0.66rem] font-semibold tracking-[0.13em] text-muted-foreground/70 uppercase">
        Verkstad
      </p>
      <div className="flex flex-col gap-0.5">
        {nav.map((n, i) => {
          const active = i === 1;
          return (
            <a
              key={n.text}
              className={cn(
                "group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[0.85rem] transition-colors",
                active
                  ? "bg-white font-semibold text-brand-700 shadow-[0_1px_2px_rgb(15_42_67/0.08)] ring-1 ring-brand-100 dark:bg-white/[0.07] dark:shadow-none dark:ring-white/10"
                  : "font-medium text-ink-soft hover:bg-white/70 hover:text-ink dark:hover:bg-white/[0.04]",
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600 transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
              <n.icon
                className={cn(
                  "size-[18px] shrink-0",
                  active ? "text-brand-600" : "text-muted-foreground",
                )}
                strokeWidth={active ? 2.25 : 2}
              />
              <span className="truncate">{n.text}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function NavigationSection() {
  return (
    <div className="space-y-10">
      <Section
        title="Sidomeny"
        description="Verkstadens huvudnavigering på desktop. Det aktiva läget är det viktigaste beslutet."
      >
        <Group title="Förslag" cols={2}>
          <Variant
            label="A"
            name="Vitt kort med accentstapel"
            source="components/layout/sidebar.tsx"
            className="p-0"
          >
            <div className="w-full p-4">
              <LiveSidebar />
            </div>
          </Variant>
          <Variant label="B" name="Mjuk orange fyllnad">
            <Sidebar
              active={1}
              itemCls="rounded-lg px-3 py-2"
              activeCls="bg-brand-500/12 text-brand-700"
            />
          </Variant>
          <Variant label="C" name="Fylld piller">
            <Sidebar
              active={1}
              itemCls="rounded-full px-4 py-2"
              activeCls="brand-fill"
            />
          </Variant>
          <Variant label="D" name="Bläcksvart markering">
            <Sidebar
              active={1}
              itemCls="rounded-lg px-3 py-2"
              activeCls="bg-ink text-canvas"
            />
          </Variant>
          <Variant label="E" name="Vänsterstreck">
            <Sidebar
              active={1}
              itemCls="rounded-r-lg border-l-2 border-transparent px-3 py-2"
              activeCls="border-brand-600! bg-brand-500/8 text-brand-700"
            />
          </Variant>
        </Group>
      </Section>

      <Section
        title="Flikar"
        description="Inuti en arbetsorder: Uppgifter · Delar · Bilder · Historik."
      >
        <Group
          title="Förslag"
          hint="appen har inga flikar i dag – inget av förslagen är live"
          cols={2}
        >
          <Variant label="A" name="Understruken" className="items-start">
            <div className="flex w-full gap-5 border-b border-line">
              {["Uppgifter", "Delar", "Bilder", "Historik"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors",
                    i === 0
                      ? "border-brand-600 text-ink"
                      : "border-transparent text-muted-foreground hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Variant>
          <Variant label="B" name="Piller i spår" className="items-start">
            <div className="inline-flex gap-1 rounded-xl bg-surface-muted p-1">
              {["Uppgifter", "Delar", "Bilder", "Historik"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    i === 0
                      ? "bg-surface text-ink shadow-card"
                      : "text-muted-foreground hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Variant>
          <Variant label="C" name="Med räknare" className="items-start">
            <div className="flex w-full gap-1 border-b border-line">
              {[
                ["Uppgifter", "5"],
                ["Delar", "12"],
                ["Bilder", "3"],
              ].map(([t, n], i) => (
                <button
                  key={t}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors",
                    i === 0
                      ? "border-brand-600 text-ink"
                      : "border-transparent text-muted-foreground hover:text-ink",
                  )}
                >
                  {t}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[0.7rem]",
                      i === 0
                        ? "bg-brand-500/15 text-brand-700"
                        : "bg-surface-muted text-muted-foreground",
                    )}
                  >
                    {n}
                  </span>
                </button>
              ))}
            </div>
          </Variant>
          <Variant label="D" name="Kantiga mappflikar" className="items-start">
            <div className="flex w-full gap-1 border-b border-line">
              {["Uppgifter", "Delar", "Bilder"].map((t, i) => (
                <button
                  key={t}
                  className={cn(
                    "-mb-px rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition-colors",
                    i === 0
                      ? "border-line bg-surface text-ink"
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

      <Section
        title="Brödsmulor och sidhuvud"
        description="Toppen av en detaljsida."
      >
        <Group title="Förslag" cols={2}>
          {/* Måtten kommer ur PageHeader – samma sidhuvud på alla vyer. */}
          <Variant
            label="A"
            name="Överrubrik + extrafet rubrik"
            source="components/layout/page-header.tsx"
            className="items-start"
          >
            <div className="flex w-full flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Fordon
                </p>
                <h1 className="text-xl leading-tight font-extrabold tracking-tight text-ink sm:text-2xl">
                  Volvo V60
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  ABC 123 · 2021 · 84 300 km
                </p>
              </div>
              <button className="brand-fill inline-flex h-10 shrink-0 items-center rounded-lg px-4 text-sm font-medium">
                Ny arbetsorder
              </button>
            </div>
          </Variant>
          <Variant label="B" name="Brödsmula över rubrik" className="items-start">
            <div className="w-full">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="hover:text-ink">Fordon</span>
                <ChevronRight className="size-3" />
                <span className="text-ink-soft">ABC 123</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-ink">
                Volvo V60
              </h3>
            </div>
          </Variant>
          <Variant label="C" name="Tillbaka-pil bredvid rubrik" className="items-start">
            <div className="flex w-full items-center gap-3">
              <button className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-surface-muted">
                <ChevronRight className="size-4 rotate-180" />
              </button>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.01em] text-ink">
                  Volvo V60
                </h3>
                <p className="text-xs text-muted-foreground">ABC 123 · 2021</p>
              </div>
            </div>
          </Variant>
        </Group>
      </Section>

      <Section
        title="Flikfält på mobil"
        description="Nederkanten i telefonen – verkstadens vanligaste enhet ute i hallen."
      >
        <Group title="Förslag" cols={2}>
          {/* Klasserna kommer ur bottom-nav.tsx, inklusive den upphöjda
              skanna-knappen mitt i raden. */}
          <Variant
            label="A"
            name="Ikon + etikett med skanna-knapp"
            source="components/layout/bottom-nav.tsx"
            className="p-0"
          >
            <div className="w-full border-t border-line bg-surface/95 pt-1">
              <div className="relative mx-auto flex items-stretch">
                <div className="flex flex-1 items-stretch justify-around">
                  {nav.slice(0, 2).map((n, i) => (
                    <span
                      key={n.text}
                      className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.66rem] font-semibold",
                        i === 0 ? "text-brand-600" : "text-muted-foreground",
                      )}
                    >
                      <n.icon
                        className={cn("size-6", i === 0 && "scale-105")}
                        strokeWidth={i === 0 ? 2.4 : 2}
                      />
                      <span className="truncate">{n.text}</span>
                    </span>
                  ))}
                </div>

                <span className="flex shrink-0 flex-col items-center justify-end gap-1 px-3 pb-1.5">
                  <span className="brand-fill -mt-7 flex size-14 items-center justify-center rounded-full shadow-[0_10px_22px_-6px_rgb(224_122_13/0.75)] ring-4 ring-surface">
                    <ScanLine className="size-7" strokeWidth={2.2} />
                  </span>
                  <span className="text-[0.66rem] font-semibold text-brand-700">
                    Scanna
                  </span>
                </span>

                <div className="flex flex-1 items-stretch justify-around">
                  {nav.slice(2, 4).map((n) => (
                    <span
                      key={n.text}
                      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.66rem] font-semibold text-muted-foreground"
                    >
                      <n.icon className="size-6" strokeWidth={2} />
                      <span className="truncate">{n.text}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Variant>
          <Variant label="B" name="Ikon + etikett, utan knapp" className="p-0">
            <div className="w-full border-t border-line bg-surface px-2 py-2">
              <div className="flex items-end justify-around">
                {nav.slice(0, 4).map((n, i) => (
                  <button
                    key={n.text}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[0.65rem] font-medium",
                      i === 0 ? "text-brand-700" : "text-muted-foreground",
                    )}
                  >
                    <n.icon className="size-5" />
                    {n.text}
                  </button>
                ))}
              </div>
            </div>
          </Variant>
          <Variant label="C" name="Aktiv ikon i chip" className="p-0">
            <div className="w-full border-t border-line bg-surface px-2 py-2">
              <div className="flex items-end justify-around">
                {nav.slice(0, 4).map((n, i) => (
                  <button
                    key={n.text}
                    className="flex flex-col items-center gap-1 px-3 py-1 text-[0.65rem] font-medium"
                  >
                    <span
                      className={cn(
                        "inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                        i === 0
                          ? "bg-brand-500/15 text-brand-700"
                          : "text-muted-foreground",
                      )}
                    >
                      <n.icon className="size-5" />
                    </span>
                    <span className={i === 0 ? "text-ink" : "text-muted-foreground"}>
                      {n.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Variant>
        </Group>
      </Section>
    </div>
  );
}
