import { Suspense, useEffect, useState, type ReactNode } from "react";
import { GenericRouteSkeleton } from "@/routes/GenericRouteSkeleton";

const DELAY_MS = 300;

/**
 * Avoid flash of skeleton on fast chunk loads: show nothing for DELAY_MS,
 * then the fallback if still suspended.
 */
function DelayedFallback({ fallback }: { fallback: ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShow(true), DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!show) return null;
  return <>{fallback}</>;
}

/** Stable Suspense for layout Outlet content (ProductAppLayout / AdminLayout). */
export function PageSuspense({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const resolved = fallback ?? <GenericRouteSkeleton />;
  return (
    <Suspense fallback={<DelayedFallback fallback={resolved} />}>
      {children}
    </Suspense>
  );
}
