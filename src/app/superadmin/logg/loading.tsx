import { Skeleton } from "@/components/ui/skeleton";


/** Speglar systemloggen: flikväxel, nyckeltal, filter, grupperade rader. */
export default function Loading() {
  return (
    <div className="w-full space-y-4 px-4 py-4 sm:px-6 lg:px-8">
      {/* Flikväxel Systemlogg / Aktiva nu */}
      <Skeleton className="h-11 w-full rounded-xl sm:h-9 sm:w-64" />

      {/* Nyckeltal */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-line pb-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-10" />
              <Skeleton className="mt-1 h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Sök + filter */}
      <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
        <Skeleton className="col-span-2 h-8 rounded-lg pointer-coarse:h-11 sm:w-64" />
        <Skeleton className="h-8 rounded-lg pointer-coarse:h-11 sm:w-48" />
        <Skeleton className="h-8 rounded-lg pointer-coarse:h-11 sm:w-48" />
        <Skeleton className="col-span-2 h-8 rounded-lg pointer-coarse:h-11 sm:col-span-1 sm:w-52" />
      </div>

      {/* Två dagsgrupper med rader */}
      {Array.from({ length: 2 }).map((_, g) => (
        <section key={g}>
          <div className="mb-2 flex items-center gap-2.5 px-1">
            <Skeleton className="h-3 w-20" />
            <span className="h-px flex-1 bg-line" aria-hidden />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <ul className="divide-y divide-line">
              {Array.from({ length: g === 0 ? 6 : 4 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
                >
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-52 max-w-full" />
                    <Skeleton className="mt-1.5 h-3 w-40 max-w-full" />
                  </div>
                  <Skeleton className="h-3 w-10 shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Paginering */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-32" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-9 rounded-lg pointer-coarse:size-11" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="size-9 rounded-lg pointer-coarse:size-11" />
        </div>
      </div>
    </div>
  );
}
