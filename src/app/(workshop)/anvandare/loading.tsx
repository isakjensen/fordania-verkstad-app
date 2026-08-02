import { SkeletonListCard } from "@/components/ui/skeleton";

/** Verkstadens användarlista: rubrik med knapp, sedan medlemsrader. */
export default function Loading() {
  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <SkeletonListCard rows={6} avatar="round" trailing="badge" />
    </div>
  );
}
