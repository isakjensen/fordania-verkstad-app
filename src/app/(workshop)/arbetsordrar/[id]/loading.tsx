import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonCardHeader } from "@/components/ui/skeleton";

/**
 * Orderdetaljen: tillbaka-knapp, huvud med ordernummer och status, sedan
 * innehållskort (arbete, delar, fordon, mekaniker) i två spalter.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-24 rounded-lg pointer-coarse:h-11" />

      {/* Huvud */}
      <div className="mt-4 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-3.5 w-56 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-lg pointer-coarse:h-11" />
          <Skeleton className="h-10 w-10 rounded-lg pointer-coarse:size-11" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Arbete */}
          <Card>
            <SkeletonCardHeader />
            <div className="divide-y divide-line px-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-48 max-w-full" />
                    <Skeleton className="mt-1.5 h-3 w-28" />
                  </div>
                  <Skeleton className="h-3.5 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </Card>

          {/* Delar */}
          <Card>
            <SkeletonCardHeader />
            <div className="divide-y divide-line px-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-40 max-w-full" />
                  </div>
                  <Skeleton className="h-3.5 w-14 shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          {/* Fordon */}
          <Card>
            <SkeletonCardHeader />
            <ul className="divide-y divide-line">
              {Array.from({ length: 2 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-6 w-[4.5rem] shrink-0 rounded-[4px]" />
                  <Skeleton className="h-3.5 w-24 flex-1" />
                </li>
              ))}
            </ul>
          </Card>

          {/* Mekaniker */}
          <Card>
            <SkeletonCardHeader />
            <ul className="divide-y divide-line">
              {Array.from({ length: 2 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="mt-1.5 h-3 w-20" />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
