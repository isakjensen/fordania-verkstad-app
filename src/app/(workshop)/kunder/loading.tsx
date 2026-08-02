import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonListRow } from "@/components/ui/skeleton";

/** Kundsidan: ett kort med CustomersView:s verktygsrad och kundlistan. */
export default function Loading() {
  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <Card>
        <div className="flex flex-col gap-2.5 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <Skeleton className="h-10 w-full rounded-lg sm:max-w-xs" />
          <div className="flex items-center gap-2 sm:ml-auto">
            <Skeleton className="h-10 w-28 rounded-lg pointer-coarse:h-11" />
            <Skeleton className="h-10 w-32 rounded-lg pointer-coarse:h-11" />
          </div>
        </div>

        <ul className="divide-y divide-line">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonListRow key={i} avatar="round" trailing="action" />
          ))}
        </ul>
      </Card>
    </div>
  );
}
