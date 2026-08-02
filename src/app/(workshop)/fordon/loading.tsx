import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonListRow } from "@/components/ui/skeleton";

/**
 * Fordonssidan: kortet fyller höjden, VehiclesView:s verktygsrad överst och
 * fordonslistan under. Raderna inleds med en registreringsskylt.
 */
export default function Loading() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col px-4 py-4 sm:px-6 lg:px-8">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Verktygsrad */}
        <div className="shrink-0 border-b border-line">
          <div className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <Skeleton className="h-10 w-full rounded-lg sm:max-w-xs" />
            <div className="flex items-center gap-2 sm:ml-auto">
              <Skeleton className="h-10 w-28 rounded-lg pointer-coarse:h-11" />
              <Skeleton className="h-10 w-36 rounded-lg pointer-coarse:h-11" />
            </div>
          </div>
        </div>

        <ul className="divide-y divide-line">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonListRow key={i} avatar="plate" trailing="action" />
          ))}
        </ul>
      </Card>
    </div>
  );
}
