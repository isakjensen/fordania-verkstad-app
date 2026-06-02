"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** Värde på formen "YYYY-MM-DD" (tomt = inget valt). */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Tillåt att rensa valt datum. */
  clearable?: boolean;
  /** Spärra datum efter idag (t.ex. för avläsningar som inte kan ske i framtiden). */
  disableFuture?: boolean;
  /** Höjd: "md" (40px, standard) eller "sm" (32px, matchar kompakta knappar). */
  size?: "sm" | "md";
}

const WEEKDAYS = ["Må", "Ti", "On", "To", "Fr", "Lö", "Sö"];
const MONTHS = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

/** Parsar "YYYY-MM-DD" till {y, m (0-index), d} eller null. */
function parseIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    y: Number(match[1]),
    m: Number(match[2]) - 1,
    d: Number(match[3]),
  };
}

function formatDisplay(value: string) {
  const p = parseIso(value);
  if (!p) return "";
  return `${p.d} ${MONTHS[p.m]} ${p.y}`;
}

/** Måndagsstartat veckoindex (0 = måndag … 6 = söndag). */
function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7;
}

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Välj datum",
  disabled,
  className,
  clearable = true,
  disableFuture = false,
  size = "md",
}: DatePickerProps) {
  const heightClass = size === "sm" ? "h-8" : "h-10";
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const selected = parseIso(value);

  // Vilken månad som visas i kalendern (utgå från valt datum, annars dagens).
  const [view, setView] = useState(() => ({
    y: selected?.y ?? today.getFullYear(),
    m: selected?.m ?? today.getMonth(),
  }));
  const [open, setOpen] = useState(false);

  const firstDay = new Date(view.y, view.m, 1);
  const leading = mondayIndex(firstDay.getDay());
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    setView((v) =>
      v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 },
    );
  }
  function nextMonth() {
    setView((v) =>
      v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 },
    );
  }

  function pick(d: number) {
    if (isDisabled(d)) return;
    onChange(toIso(view.y, view.m, d));
    setOpen(false);
  }

  const isToday = (d: number) =>
    today.getFullYear() === view.y &&
    today.getMonth() === view.m &&
    today.getDate() === d;
  const isSelected = (d: number) =>
    selected?.y === view.y && selected?.m === view.m && selected?.d === d;
  const isDisabled = (d: number) =>
    disableFuture && new Date(view.y, view.m, d).getTime() > todayMidnight;
  // Om hela nästa månad ligger i framtiden ska framåtpilen spärras.
  const nextMonthBlocked =
    disableFuture &&
    new Date(
      view.m === 11 ? view.y + 1 : view.y,
      view.m === 11 ? 0 : view.m + 1,
      1,
    ).getTime() > todayMidnight;

  return (
    // Fast höjd så Base UI:s fokusvakter inte kan ändra radens layout.
    <div className={cn("relative w-full", heightClass, className)}>
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        type="button"
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 text-left text-sm text-ink shadow-xs outline-none transition-colors hover:border-brand-300 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50 data-[popup-open]:border-brand-500 data-[popup-open]:ring-2 data-[popup-open]:ring-brand-500/30",
          heightClass,
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} align="start" className="z-50">
          <Popover.Popup className="w-[18rem] origin-[var(--transform-origin)] rounded-xl border border-line bg-surface p-3 shadow-lg ring-1 ring-black/[0.04] transition-[transform,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {/* Månadsnavigering */}
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Föregående månad"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-semibold text-ink">
                {MONTHS[view.m].charAt(0).toUpperCase() + MONTHS[view.m].slice(1)}{" "}
                {view.y}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                disabled={nextMonthBlocked}
                aria-label="Nästa månad"
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Veckodagar */}
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="flex h-7 items-center justify-center text-[0.7rem] font-semibold text-muted-foreground"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Dagar */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) =>
                d === null ? (
                  <div key={`e${i}`} />
                ) : (
                  <button
                    key={d}
                    type="button"
                    onClick={() => pick(d)}
                    disabled={isDisabled(d)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors",
                      isDisabled(d)
                        ? "cursor-not-allowed text-muted-foreground/30"
                        : isSelected(d)
                          ? "bg-brand-600 font-semibold text-white hover:bg-brand-600"
                          : "text-ink hover:bg-brand-50 hover:text-brand-700",
                      !isDisabled(d) &&
                        !isSelected(d) &&
                        isToday(d) &&
                        "font-semibold text-brand-600 ring-1 ring-inset ring-brand-200",
                    )}
                  >
                    {d}
                  </button>
                ),
              )}
            </div>

            {/* Snabbval */}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  setView({ y: t.getFullYear(), m: t.getMonth() });
                  onChange(toIso(t.getFullYear(), t.getMonth(), t.getDate()));
                  setOpen(false);
                }}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
              >
                Idag
              </button>
              {clearable && value ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  Rensa
                </button>
              ) : null}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
    </div>
  );
}
