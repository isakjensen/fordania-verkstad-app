"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ScrollText, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "log", label: "Systemlogg", icon: ScrollText },
  { value: "live", label: "Aktiva nu", icon: Radio },
] as const;

/** Segmenterad växel mellan loggen och live-närvarovyn (styr ?view). */
export function LogTabs({ active }: { active: "log" | "live" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(value: string) {
    if (value === active) return;
    const next = new URLSearchParams(params.toString());
    if (value === "log") next.delete("view");
    else next.set("view", value);
    // Loggens filter/sidnummer är irrelevanta i live-vyn.
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    // Touch: full bredd med hälften var, så båda flikarna blir stora träffytor.
    <div className="inset-track flex w-full rounded-xl border border-line bg-surface-muted p-0.5 sm:inline-flex sm:w-auto">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = t.value === active;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => select(t.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all sm:flex-none",
              "pointer-coarse:min-h-11",
              isActive
                ? "raised bg-surface text-ink ring-1 ring-line-strong"
                : "text-muted-foreground hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
