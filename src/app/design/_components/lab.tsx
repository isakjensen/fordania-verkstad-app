"use client";

import { useState, type CSSProperties } from "react";
import {
  Blocks,
  Boxes,
  Compass,
  MousePointerClick,
  Moon,
  Palette,
  Radio,
  Ruler,
  Sun,
  Tag,
  TextCursorInput,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { ButtonsSection } from "../_sections/buttons";
import { FeedbackSection } from "../_sections/feedback";
import { FordaniaSection } from "../_sections/fordania";
import { FormsSection } from "../_sections/forms";
import { FoundationsSection } from "../_sections/foundations";
import { LiveOverviewSection } from "../_sections/live-overview";
import { NavigationSection } from "../_sections/navigation";
import { StatusSection } from "../_sections/status";
import { SurfacesSection } from "../_sections/surfaces";

/* ------------------------------------------------------------------ *
 *  Designlabbet. Helt fristående från appens riktiga vyer: ändringar
 *  här syns bara på /design.
 *
 *  Mörkt läge sätts som en klass på förhandsvisningens omslag i stället
 *  för på <html>, så labbet kan visa ljust och mörkt sida vid sida utan
 *  att röra användarens eget temaval.
 * ------------------------------------------------------------------ */

const sections = [
  {
    id: "live",
    name: "Live nu",
    icon: Radio,
    render: LiveOverviewSection,
  },
  { id: "grunder", name: "Grunder", icon: Palette, render: FoundationsSection },
  { id: "knappar", name: "Knappar", icon: MousePointerClick, render: ButtonsSection },
  { id: "falt", name: "Fält", icon: TextCursorInput, render: FormsSection },
  { id: "status", name: "Status", icon: Tag, render: StatusSection },
  { id: "ytor", name: "Kort & listor", icon: Boxes, render: SurfacesSection },
  { id: "navigering", name: "Navigering", icon: Compass, render: NavigationSection },
  { id: "aterkoppling", name: "Återkoppling", icon: Blocks, render: FeedbackSection },
  { id: "fordania", name: "Verkstaden", icon: Wrench, render: FordaniaSection },
];

type Mode = "light" | "dark" | "split";

/**
 * En förhandsvisning i ett givet läge. Ligger utanför DesignLab med flit –
 * annars skulle React montera om hela innehållet varje gång man drar i
 * radie-reglaget, och provens egna av/på-lägen nollställas.
 */
function Stage({
  dark,
  radius,
  showLabel,
  children,
}: {
  dark: boolean;
  radius: number;
  showLabel: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("min-w-0 flex-1", dark && "dark")}
      style={{ "--radius": `${radius}rem` } as CSSProperties}
    >
      <div className="h-full bg-canvas p-4 sm:p-6">
        {showLabel ? (
          <p className="mb-4 font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase">
            {dark ? "Mörkt läge" : "Ljust läge"}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function DesignLab() {
  const [activeId, setActiveId] = useState(sections[0].id);
  const [mode, setMode] = useState<Mode>("light");
  const [radius, setRadius] = useState(0.65);

  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const Section = active.render;

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Sidhuvud */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <div className="mr-auto">
            <h1 className="text-[0.95rem] font-semibold tracking-[-0.01em] text-ink">
              Designlabb
            </h1>
            <p className="text-xs text-muted-foreground">
              Fristående yta – inget här påverkar appens riktiga sidor.
            </p>
          </div>

          {/* Ljust / mörkt / sida vid sida */}
          <div className="inline-flex gap-1 rounded-lg bg-surface-muted p-1">
            {(
              [
                { id: "light", label: "Ljust", icon: Sun },
                { id: "dark", label: "Mörkt", icon: Moon },
                { id: "split", label: "Båda", icon: Blocks },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
                  mode === m.id
                    ? "bg-surface text-ink shadow-card"
                    : "text-muted-foreground hover:text-ink",
                )}
              >
                <m.icon className="size-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Radie – styr hela förhandsvisningen */}
          <label className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5">
            <Ruler className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Radie</span>
            <input
              type="range"
              min={0}
              max={1.6}
              step={0.05}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-24 accent-brand-600"
            />
            <span className="w-12 font-mono text-[0.7rem] text-muted-foreground">
              {radius.toFixed(2)}
            </span>
          </label>
        </div>

        {/* Sektionsflikar */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-line px-4 py-2 sm:px-6">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                s.id === activeId
                  ? "bg-brand-500/12 text-brand-700"
                  : "text-ink-soft hover:bg-surface-muted",
              )}
            >
              <s.icon className="size-4" />
              {s.name}
            </button>
          ))}
        </nav>
      </header>

      {/* Förhandsvisning */}
      <main
        className={cn(
          "flex",
          mode === "split" && "flex-col divide-y divide-line xl:flex-row xl:divide-x xl:divide-y-0",
        )}
      >
        {mode === "split" ? (
          <>
            <Stage dark={false} radius={radius} showLabel>
              <Section />
            </Stage>
            <Stage dark radius={radius} showLabel>
              <Section />
            </Stage>
          </>
        ) : (
          <Stage dark={mode === "dark"} radius={radius} showLabel={false}>
            <Section />
          </Stage>
        )}
      </main>
    </div>
  );
}
