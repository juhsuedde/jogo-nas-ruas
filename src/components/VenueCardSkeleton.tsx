import { Skeleton } from "@/components/ui/skeleton";

export function VenueCardSkeleton() {
  return (
    <div className="w-full rounded-2xl bg-card p-4 handmade-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <Skeleton className="size-10 rounded-xl" />
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}
