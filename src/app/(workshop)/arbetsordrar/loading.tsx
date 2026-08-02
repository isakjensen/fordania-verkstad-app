import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonListRow } from "@/components/ui/skeleton";

/**
 * Ordersidan: ett kort som fyller höjden, med OrdersView:s verktygsrad
 * (Mina/Alla-växel + statusfilter + knappar) överst och listan under.
 */
export default function Loading() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col px-4 py-5 sm:px-6 lg:px-8">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Verktygsrad */}
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-40 rounded-xl pointer-coarse:h-11" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-lg pointer-coarse:h-11" />
              <Skeleton className="h-9 w-32 rounded-lg pointer-coarse:h-11" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>

        <ul className="divide-y divide-line">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonListRow key={i} avatar="plate" trailing="badge" />
          ))}
        </ul>
      </Card>
    </div>
  );
}
