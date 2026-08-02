import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Kalendern har två helt olika vyer och skelettet speglar båda:
 *
 *  - Touch (< lg): MobileAgenda – månadsrubrik, veckoremsa med sju dagspiller
 *    och dagens agenda grupperad per mekaniker.
 *  - Desktop (lg+): verktygsrad + WeekBoard – ej tilldelade-facket överst och
 *    rutnätet med sticky fordonsetikett till vänster och sju dagkolumner.
 */

const LABEL_W = 180;

export default function Loading() {
  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
      {/* ---------- Verktygsrad – endast desktop ---------- */}
      <div className="hidden shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line pb-3 lg:flex">
        {/* Dag/Vecka-växel */}
        <Skeleton className="h-10 w-44 rounded-xl pointer-coarse:h-12" />
        <div className="flex flex-1 items-center justify-end gap-2">
          <Skeleton className="h-10 w-20 rounded-lg pointer-coarse:h-12" />
          {/* Nav-grupp: pil · datumintervall · pil */}
          <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-2 pointer-coarse:h-12">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-3.5 w-40 sm:w-48" />
            <Skeleton className="size-6 rounded-md" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg pointer-coarse:h-12" />
        </div>
      </div>

      {/* ---------- Desktop: WeekBoard ---------- */}
      <div className="mt-4 hidden min-h-0 flex-1 flex-col gap-3 lg:flex">
        {/* Ej tilldelade-facket */}
        <div className="shrink-0 rounded-2xl border border-line bg-surface p-3 shadow-card">
          <div className="flex items-center gap-2 pb-2.5">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-44 shrink-0 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Rutnätet */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {/* Dagrubriker */}
          <div className="flex border-b border-line">
            <div
              className="flex shrink-0 items-center border-r border-line px-4 py-2.5"
              style={{ width: LABEL_W }}
            >
              <Skeleton className="h-2.5 w-16" />
            </div>
            <div className="grid flex-1 grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-1.5 border-l border-line py-2.5"
                >
                  <Skeleton className="h-2.5 w-7" />
                  <Skeleton className="size-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Mekanikersektioner med fordonsrader */}
          {[2, 3, 2].map((rows, section) => (
            <div key={section}>
              {/* Mekanikerrubrik */}
              <div className="flex items-center gap-2.5 border-b border-line bg-surface-muted/40 px-4 py-1.5">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <Skeleton className="h-3.5 w-32" />
              </div>

              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex min-h-[44px] border-b border-line">
                  {/* Fordonsetikett */}
                  <div
                    className="flex shrink-0 items-center gap-2 border-r border-line px-3 py-1.5"
                    style={{ width: LABEL_W }}
                  >
                    <Skeleton className="size-6 shrink-0 rounded-md" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  {/* Dagceller – några med jobbklossar */}
                  <div className="grid flex-1 grid-cols-7">
                    {Array.from({ length: 7 }).map((_, c) => (
                      <div key={c} className="border-l border-line p-1">
                        {(c + r + section) % 3 === 0 ? (
                          <Skeleton className="h-8 w-full rounded-lg" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Touch: MobileAgenda ---------- */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {/* Månad + Idag + skapa */}
        <div className="flex items-center justify-between gap-2 pb-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20 rounded-lg pointer-coarse:h-12" />
            <Skeleton className="h-10 w-32 rounded-lg pointer-coarse:h-12" />
          </div>
        </div>

        {/* Veckoremsa – sju dagspiller, ett markerat */}
        <div className="border-b border-line pb-3">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5",
                  i === 2 && "bg-ink/[0.04]",
                )}
              >
                <Skeleton className="h-2 w-5" />
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="size-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Dagens agenda, grupperad per mekaniker */}
        <div className="min-h-0 flex-1 space-y-5 overflow-hidden pt-3">
          {[2, 1].map((cards, g) => (
            <section key={g}>
              <div className="flex items-center gap-2 px-0.5 pb-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-4" />
              </div>
              <ul className="space-y-2">
                {Array.from({ length: cards }).map((_, i) => (
                  <li
                    key={i}
                    className="rounded-2xl border border-line bg-surface p-3 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Skeleton className="h-6 w-[4.5rem] rounded-[4px]" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
