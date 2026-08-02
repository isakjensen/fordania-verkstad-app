import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonCardHeader } from "@/components/ui/skeleton";

/**
 * Fordonsdetaljen: tillbaka-knapp, huvud med skylt och rubrik, sedan ett
 * smalare uppgiftskort och ett bredare innehållskort.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-24 rounded-lg pointer-coarse:h-11" />

      {/* Huvud */}
      <div className="mt-4 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[7.5rem] shrink-0 rounded-md" />
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-1.5 h-3.5 w-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-lg pointer-coarse:h-11" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Uppgifter */}
        <Card className="lg:col-span-2">
          <SkeletonCardHeader action={false} />
          <div className="divide-y divide-line px-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        </Card>

        {/* Arbetsordrar / historik */}
        <Card className="lg:col-span-3">
          <SkeletonCardHeader />
          <ul className="divide-y divide-line">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-44 max-w-full" />
                  <Skeleton className="mt-1.5 h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
