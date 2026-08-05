import { Suspense, useEffect, useState, type ReactNode } from "react";
import { GenericRouteSkeleton } from "@/routes/GenericRouteSkeleton";

const DELAY_MS = 300;

/**
 * True once route content has committed at least once. Before that there is no
 * previous page to hold on screen, so the anti-flash delay would only expose an
 * empty <main>.
 */
let routeContentHasPainted = false;

function MarkRouteContentPainted() {
  useEffect(() => {
    routeContentHasPainted = true;
  }, []);
  return null;
}

/**
 * Avoid flash of skeleton on fast chunk loads: once a page has been painted,
 * show nothing for DELAY_MS (the previous page stays up), then the fallback if
 * still suspended. On the first paint the fallback is shown immediately.
 */
function DelayedFallback({ fallback }: { fallback: ReactNode }) {
  const [show, setShow] = useState(() => !routeContentHasPainted);

  useEffect(() => {
    if (show) return;
    const id = window.setTimeout(() => setShow(true), DELAY_MS);
    return () => window.clearTimeout(id);
  }, [show]);

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
      <MarkRouteContentPainted />
      {children}
    </Suspense>
  );
}
