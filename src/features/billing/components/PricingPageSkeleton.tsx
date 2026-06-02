import { Skeleton } from "@/components/ui/skeleton";

export function PricingPageSkeleton() {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <Skeleton className="h-[420px] rounded-xl" />
      <Skeleton className="h-[420px] rounded-xl" />
    </div>
  );
}
