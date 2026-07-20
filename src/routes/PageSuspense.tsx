import { Suspense, type ReactNode } from "react";
import { GenericRouteSkeleton } from "@/routes/GenericRouteSkeleton";

/** Suspend only page content so AppLayout / Admin chrome stays mounted. */
export function PageSuspense({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback ?? <GenericRouteSkeleton />}>
      {children}
    </Suspense>
  );
}
