import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { ensureBillingEligibility } from "@/features/billing/billingEligibility";
import {
  currentBillingPlatform,
  nativeRevenueCatApiKey,
} from "@/features/billing/billingPlatform";

/**
 * Native-only: after auth resolves, identify RevenueCat with Apex user.id,
 * then POST /api/billing/refresh, then refresh /api/auth/me.
 * Runs once per authenticated user id (no refresh loops).
 */
export default function NativeBillingIdentitySync() {
  const { user, loading, refreshMe } = useAuth();
  const syncedUserIdRef = useRef<string | null>(null);
  const inFlightUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (loading) return;

    if (!user?.id) {
      syncedUserIdRef.current = null;
      inFlightUserIdRef.current = null;
      return;
    }

    const userId = user.id;
    if (
      syncedUserIdRef.current === userId ||
      inFlightUserIdRef.current === userId
    ) {
      return;
    }

    const platform = currentBillingPlatform();
    const apiKey = nativeRevenueCatApiKey(platform);
    if (!apiKey) return;

    let cancelled = false;
    inFlightUserIdRef.current = userId;

    void (async () => {
      try {
        await ensureBillingEligibility({
          userId,
          email: user.email ?? null,
          identifyNative: true,
          forceRefresh: true,
        });
        if (cancelled) return;
        await refreshMe();
        if (cancelled) return;
        syncedUserIdRef.current = userId;
      } catch {
        // Soft failure: Pricing preflight / purchase guard will retry and fail closed.
        if (!cancelled && syncedUserIdRef.current !== userId) {
          syncedUserIdRef.current = null;
        }
      } finally {
        if (inFlightUserIdRef.current === userId) {
          inFlightUserIdRef.current = null;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user?.id, user?.email, refreshMe]);

  return null;
}
