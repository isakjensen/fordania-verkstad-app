"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldSelect } from "@/components/ui/field-select";
import { CATEGORY_FILTER, TIMEFRAME_FILTER } from "./audit-meta";

export function AuditFilters({
  tenants,
}: {
  tenants: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const firstRun = useRef(true);

  /** Sätt (eller ta bort) en parameter och nollställ sidnumret. */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  // Debounce fritextsökningen.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => setParam("q", q.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const tenantOptions = [
    { value: "all", label: "Alla företag" },
    ...tenants.map((t) => ({ value: t.id, label: t.name })),
  ];

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Sök */}
      <div className="relative min-w-0 flex-1 sm:min-w-[16rem]">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        {pending ? (
          <Loader2 className="absolute right-3 top-1/2 z-10 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sök händelse, användare, företag eller IP…"
          aria-label="Sök i loggen"
          className={cn(
            "h-8 w-full rounded-lg border border-line bg-surface pl-9 pr-9 text-sm text-ink shadow-xs outline-none transition-colors pointer-coarse:h-11",
            "placeholder:text-muted-foreground hover:border-brand-300 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30",
            "[&::-webkit-search-cancel-button]:appearance-none",
          )}
        />
      </div>

      {/* Kategori */}
      <FieldSelect
        options={CATEGORY_FILTER}
        value={params.get("category") ?? "all"}
        onValueChange={(v) => setParam("category", v)}
        className="sm:w-48"
      />

      {/* Företag */}
      <FieldSelect
        options={tenantOptions}
        value={params.get("tenant") ?? "all"}
        onValueChange={(v) => setParam("tenant", v)}
        className="sm:w-52"
      />

      {/* Tidsperiod */}
      <FieldSelect
        options={TIMEFRAME_FILTER}
        value={params.get("days") ?? "all"}
        onValueChange={(v) => setParam("days", v)}
        className="sm:w-48"
      />
    </div>
  );
}
