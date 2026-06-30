import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateSessionDerivedCaches } from "@/lib/profileQueryKeys";

/**
 * Keeps profile race history, activity feeds, and summaries fresh after upload / manual log
 * (`apex:activity-updated`), even when the user never opened Home in this SPA session.
 */
export default function SessionDataCacheSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function onActivityUpdated() {
      void invalidateSessionDerivedCaches(queryClient, {});
    }
    if (typeof window === "undefined") return undefined;
    window.addEventListener("apex:activity-updated", onActivityUpdated);
    return () =>
      window.removeEventListener("apex:activity-updated", onActivityUpdated);
  }, [queryClient]);

  return null;
}
