"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuditPagination({
  page,
  pageCount,
  total,
  pageSize,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function goto(p: number) {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground tabular-nums">
        {total === 0 ? "0 händelser" : `Visar ${from}–${to} av ${total}`}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => goto(page - 1)}
          disabled={page <= 1}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition-colors",
            "hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40",
          )}
          aria-label="Föregående sida"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[5rem] text-center text-xs font-medium tabular-nums text-ink-soft">
          Sida {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => goto(page + 1)}
          disabled={page >= pageCount}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition-colors",
            "hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40",
          )}
          aria-label="Nästa sida"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
