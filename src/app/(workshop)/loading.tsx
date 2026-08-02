import { Card } from "@/components/ui/card";
import {
  SkeletonKpiRow,
  SkeletonCardHeader,
  SkeletonListRow,
} from "@/components/ui/skeleton";

/**
 * Översikten: KPI-band överst, sedan två rader med ett brett och ett smalt
 * kort (dagens jobb / flottstatus, respektive kräver åtgärd / mekanikerlast).
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 lg:h-full lg:gap-5 lg:overflow-hidden lg:p-6">
      <SkeletonKpiRow />

      {[0, 1].map((row) => (
        <div
          key={row}
          className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-5"
        >
          <Card className="lg:flex-[3]">
            <SkeletonCardHeader action={false} />
            <ul className="divide-y divide-line">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonListRow key={i} avatar="plate" trailing="badge" />
              ))}
            </ul>
          </Card>
          <Card className="lg:flex-[2]">
            <SkeletonCardHeader action={false} />
            <ul className="divide-y divide-line">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonListRow key={i} avatar="round" trailing="text" />
              ))}
            </ul>
          </Card>
        </div>
      ))}
    </div>
  );
}
