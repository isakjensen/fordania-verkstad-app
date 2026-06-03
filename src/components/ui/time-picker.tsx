"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  /** Värde på formen "HH:MM". */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Höjd: "md" (44px, standard – matchar knapparnas touch-höjd) eller "sm" (36px, kompakt). */
  size?: "sm" | "md";
  /** Minutsteg i listan (standard 5). */
  minuteStep?: number;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Scrollbar kolumn med markerat valt värde (centreras vid öppning). */
function Column({
  items,
  selected,
  onPick,
}: {
  items: number[];
  selected: number;
  onPick: (v: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Vänta tills popovern är positionerad innan vi centrerar valet.
    const t = setTimeout(() => {
      selRef.current?.scrollIntoView({ block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-y-auto px-1 [scrollbar-width:thin]"
    >
      <div className="py-1">
        {items.map((v) => {
          const active = v === selected;
          return (
            <button
              key={v}
              ref={active ? selRef : undefined}
              type="button"
              onClick={() => onPick(v)}
              className={cn(
                "flex w-full justify-center rounded-md py-1.5 text-sm tabular-nums transition-colors",
                active
                  ? "bg-brand-600 font-semibold text-white hover:bg-brand-600"
                  : "text-ink hover:bg-brand-50 hover:text-brand-700",
              )}
            >
              {pad(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TimePicker({
  value,
  onChange,
  id,
  disabled,
  className,
  size = "md",
  minuteStep = 5,
}: TimePickerProps) {
  const heightClass =
    size === "sm" ? "h-8 pointer-coarse:h-10" : "h-8 pointer-coarse:h-11";
  const [open, setOpen] = useState(false);

  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  const hour = m ? Math.min(23, Math.max(0, Number(m[1]))) : 8;
  const minute = m ? Math.min(59, Math.max(0, Number(m[2]))) : 0;

  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => i * minuteStep,
  );
  // Säkerställ att ett befintligt udda minutvärde syns i listan.
  if (!minutes.includes(minute)) minutes.push(minute);
  minutes.sort((a, b) => a - b);

  return (
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
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 tabular-nums", !value && "text-muted-foreground")}>
            {value || "––:––"}
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" sideOffset={6} align="start" className="z-50">
            <Popover.Popup className="flex h-[216px] w-[140px] origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lg ring-1 ring-black/[0.04] transition-[transform,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
              <Column
                items={HOURS}
                selected={hour}
                onPick={(h) => onChange(`${pad(h)}:${pad(minute)}`)}
              />
              <div className="w-px shrink-0 bg-line" />
              <Column
                items={minutes}
                selected={minute}
                onPick={(mi) => onChange(`${pad(hour)}:${pad(mi)}`)}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
