import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skanningsresultatet: smal kolumn med fordonshuvud (skylt, titel, faktarutor)
 * och arbetsordrarna under.
 */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 pt-4">
      <Skeleton className="h-10 w-32 rounded-xl pointer-coarse:h-11" />

      {/* Fordonshuvud */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-[7.5rem] rounded-md" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-6 w-44" />
        <Skeleton className="mt-2 h-3.5 w-28" />

        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1.5 h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Arbetsordrar */}
      <div className="mt-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-2.5 h-3.5 w-full" />
            <Skeleton className="mt-1.5 h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
