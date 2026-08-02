import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonCardHeader } from "@/components/ui/skeleton";

/** Tre summeringssiffror på rad, sedan uppdragslistan med tidkolumn. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-surface p-4 shadow-card"
          >
            <Skeleton className="h-7 w-10" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </div>
        ))}
      </div>

      <Card className="mt-5">
        <SkeletonCardHeader action={false} />
        <ul className="divide-y divide-line">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex gap-4 px-5 py-4">
              {/* Tid */}
              <div className="w-16 shrink-0 pt-0.5">
                <Skeleton className="h-3.5 w-12" />
                <Skeleton className="ml-5 mt-1.5 h-3 w-7" />
              </div>
              {/* Innehåll */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton className="h-6 w-[4.5rem] rounded-[4px]" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
