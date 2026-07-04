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
    <div className="inline-flex rounded-xl border border-line bg-surface-muted p-0.5">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = t.value === active;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => select(t.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all",
              isActive
                ? "bg-surface text-ink shadow-xs ring-1 ring-line"
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
