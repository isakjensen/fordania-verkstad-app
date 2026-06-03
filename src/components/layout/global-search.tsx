"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Car,
  Contact,
  ClipboardList,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { globalSearch } from "@/app/(workshop)/search-actions";
import type { SearchGroup, SearchHit } from "@/lib/search-types";

const groupMeta: Record<SearchGroup, { label: string; icon: LucideIcon }> = {
  vehicle: { label: "Fordon", icon: Car },
  customer: { label: "Kunder", icon: Contact },
  job: { label: "Arbetsordrar", icon: ClipboardList },
};
const groupOrder: SearchGroup[] = ["vehicle", "customer", "job"];

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  // Debounced sökning – ignorerar svar som hunnit bli inaktuella.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await globalSearch(term);
        if (id === reqId.current) {
          setHits(res);
          setActive(0);
          setLoading(false);
        }
      } catch {
        if (id === reqId.current) {
          setHits([]);
          setLoading(false);
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  // Stäng vid klick utanför
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ("");
    setHits([]);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
      return;
    }
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active];
      if (hit) go(hit.href);
    }
  }

  const term = q.trim();
  const showPanel = open && term.length >= 2;

  return (
    <div ref={rootRef} className="relative hidden flex-1 sm:block sm:max-w-2xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Sök fordon, reg.nr, kund eller order…"
        aria-label="Sök"
        className={cn(
          "h-10 w-full rounded-xl border border-line bg-surface-muted pl-9 pr-9 text-sm text-ink shadow-soft outline-none transition-all pointer-coarse:h-12 pointer-coarse:text-base",
          "placeholder:text-muted-foreground",
          "hover:border-line-strong focus:border-brand-400 focus:bg-surface focus:ring-2 focus:ring-brand-500/20",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}

      {showPanel ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
          {hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {loading ? "Söker…" : `Inga träffar för "${term}"`}
            </p>
          ) : (
            <ul className="max-h-[min(70vh,28rem)] overflow-y-auto py-1.5">
              {groupOrder.map((group) => {
                const items = hits.filter((h) => h.group === group);
                if (!items.length) return null;
                const Meta = groupMeta[group];
                return (
                  <li key={group}>
                    <p className="px-3 pb-1 pt-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                      {Meta.label}
                    </p>
                    <ul>
                      {items.map((hit) => {
                        const idx = hits.indexOf(hit);
                        const isActive = idx === active;
                        const Icon = Meta.icon;
                        return (
                          <li key={`${hit.group}-${hit.id}`}>
                            <button
                              type="button"
                              onMouseEnter={() => setActive(idx)}
                              onClick={() => go(hit.href)}
                              className={cn(
                                "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                                isActive ? "bg-brand-50" : "hover:bg-surface-muted",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                  isActive
                                    ? "bg-brand-100 text-brand-700"
                                    : "bg-surface-muted text-muted-foreground",
                                )}
                              >
                                <Icon className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-ink">
                                  {hit.title}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {hit.subtitle}
                                </span>
                              </span>
                              {isActive ? (
                                <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
          {hits.length > 0 ? (
            <div className="flex items-center justify-end gap-3 border-t border-line bg-surface-muted/50 px-3 py-1.5 text-[0.65rem] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-line bg-surface px-1 py-0.5 font-sans">
                  ↑↓
                </kbd>
                bläddra
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-line bg-surface px-1 py-0.5 font-sans">
                  ↵
                </kbd>
                öppna
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
