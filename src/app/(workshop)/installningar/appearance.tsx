"use client";

import { Sun, Moon, Monitor, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/lib/theme";

const options: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Ljust", icon: Sun },
  { value: "dark", label: "Mörkt", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const palettes = {
  light: { bg: "#f3ede4", surface: "#ffffff", bar: "#e07a0d", line: "#e4dccf" },
  dark: { bg: "#0c0b0a", surface: "#161513", bar: "#eb7d12", line: "#2a2825" },
};

/** Liten mock av gränssnittet i respektive läge. */
function Preview({ mode }: { mode: Theme }) {
  const halves = mode === "system" ? ["light", "dark"] : [mode];
  return (
    <div className="flex h-16 w-full overflow-hidden rounded-xl border border-line">
      {(halves as ("light" | "dark")[]).map((m, i) => {
        const p = palettes[m];
        return (
          <div
            key={m}
            className="relative flex-1 p-2"
            style={{ background: p.bg }}
          >
            <div
              className="h-full w-full rounded-md p-1.5"
              style={{ background: p.surface }}
            >
              <div
                className="h-1.5 w-7 rounded-full"
                style={{ background: p.bar }}
              />
              <div
                className="mt-1.5 h-1 w-full rounded-full"
                style={{ background: p.line }}
              />
              <div
                className="mt-1 h-1 w-2/3 rounded-full"
                style={{ background: p.line }}
              />
            </div>
            {mode === "system" && i === 0 ? (
              <span className="absolute inset-y-0 right-0 w-px bg-line" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {options.map((o) => {
        const active = theme === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            aria-pressed={active}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border p-3 text-left transition-colors",
              active
                ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                : "border-line bg-surface hover:bg-surface-muted",
            )}
          >
            <Preview mode={o.value} />
            <div className="flex items-center gap-2 px-1">
              <Icon
                className={cn(
                  "size-4",
                  active ? "text-brand-600" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-semibold",
                  active ? "text-brand-700" : "text-ink",
                )}
              >
                {o.label}
              </span>
              {active ? (
                <Check className="ml-auto size-4 text-brand-600" />
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
