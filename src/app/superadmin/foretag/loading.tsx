import { SkeletonListCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <SkeletonListCard rows={8} toolbar filterWidth="sm:w-44" />
    </div>
  );
}
