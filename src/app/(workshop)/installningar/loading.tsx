import { Skeleton } from "@/components/ui/skeleton";

/** Inställningar: staplade sektioner med ikon, rubrik och innehåll. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        {[3, 4, 3].map((rows, s) => (
          <section
            key={s}
            className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
          >
            <div className="flex items-start gap-3 border-b border-line px-5 py-4">
              <Skeleton className="size-9 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1.5 h-3.5 w-64 max-w-full" />
              </div>
            </div>
            <div className="space-y-3 p-5">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
