import { Card } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonKpiRow,
  SkeletonCardHeader,
  SkeletonListCard,
  SkeletonListRow,
} from "@/components/ui/skeleton";

/** Speglar översiktens layout: KPI-band, två kort sida vid sida, användarlista. */
export default function Loading() {
  return (
    <div className="w-full space-y-5 px-4 py-4 sm:px-6 lg:px-8">
      <SkeletonKpiRow />

      <div className="grid gap-5 lg:grid-cols-3">
        <SkeletonListCard className="lg:col-span-2" rows={5} />

        {/* Företag per status – fyra staplar */}
        <Card>
          <SkeletonCardHeader action={false} />
          <div className="space-y-4 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-6" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Senast tillagda användare */}
      <Card>
        <SkeletonCardHeader />
        <ul className="divide-y divide-line">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonListRow key={i} avatar="round" trailing="text" />
          ))}
        </ul>
      </Card>
    </div>
  );
}
