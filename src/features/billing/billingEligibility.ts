import {
  refreshBillingSubscription,
  type BillingRefreshResponse,
} from "@/lib/api/activityBilling";
import type { BillingStore } from "./billingStore";
import {
  entitlementHasPaidPro,
  normalizeBillingStores,
} from "./billingStore";
import {
  ALREADY_HAVE_PRO_MESSAGE,
  BILLING_SYNC_RETRY_MESSAGE,
} from "./subscriptionManagement";
import { ensureNativeRevenueCatIdentity } from "./revenueCatNativeIdentity";
import {
  currentBillingPlatform,
  nativeRevenueCatApiKey,
} from "./billingPlatform";

export type BillingEligibilityResult = {
  hasPaidPro: boolean;
  billingStores: BillingStore[];
  refresh: BillingRefreshResponse;
};

type EnsureBillingEligibilityParams = {
  userId: string;
  email?: string | null;
  /** Re-run refresh even if this user already completed a soft preflight. */
  forceRefresh?: boolean;
  /** Identify native RC before refresh. No-op on web / missing native key. */
  identifyNative?: boolean;
  refreshFn?: () => Promise<BillingRefreshResponse>;
  identifyNativeFn?: (params: {
    userId: string;
    email?: string | null;
  }) => Promise<unknown>;
};

let softCache: {
  userId: string;
  result: BillingEligibilityResult;
} | null = null;
let inFlight: {
  userId: string;
  forceRefresh: boolean;
  promise: Promise<BillingEligibilityResult>;
} | null = null;

export function resetBillingEligibilityForTests(): void {
  softCache = null;
  inFlight = null;
}

export function clearBillingEligibilityCache(): void {
  softCache = null;
}

export function getCachedBillingEligibility(
  userId: string,
): BillingEligibilityResult | null {
  if (softCache?.userId === userId) return softCache.result;
  return null;
}

function mapRefreshToEligibility(
  refresh: BillingRefreshResponse,
): BillingEligibilityResult {
  return {
    hasPaidPro: entitlementHasPaidPro(refresh.entitlement),
    billingStores: normalizeBillingStores(refresh.entitlement.billingStores),
    refresh,
  };
}

/**
 * Identity (native) then POST /api/billing/refresh.
 * Soft results are cached per user; `forceRefresh` always hits the API (purchase guard).
 */
export async function ensureBillingEligibility(
  params: EnsureBillingEligibilityParams,
): Promise<BillingEligibilityResult> {
  const forceRefresh = params.forceRefresh === true;
  const identifyNative = params.identifyNative === true;

  if (!forceRefresh && softCache?.userId === params.userId) {
    return softCache.result;
  }

  if (
    inFlight &&
    inFlight.userId === params.userId &&
    inFlight.forceRefresh === forceRefresh
  ) {
    return inFlight.promise;
  }

  const promise = (async (): Promise<BillingEligibilityResult> => {
    try {
      if (identifyNative) {
        if (params.identifyNativeFn) {
          await params.identifyNativeFn({
            userId: params.userId,
            email: params.email ?? null,
          });
        } else {
          const platform = currentBillingPlatform();
          const apiKey = nativeRevenueCatApiKey(platform);
          if (platform !== "web" && apiKey) {
            await ensureNativeRevenueCatIdentity({
              userId: params.userId,
              email: params.email ?? null,
            });
          }
        }
      }

      const refreshFn = params.refreshFn ?? refreshBillingSubscription;
      const refresh = await refreshFn();
      const result = mapRefreshToEligibility(refresh);
      softCache = { userId: params.userId, result };
      return result;
    } catch (error) {
      const detail =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "";
      throw new Error(
        detail && detail !== BILLING_SYNC_RETRY_MESSAGE
          ? `${BILLING_SYNC_RETRY_MESSAGE} (${detail})`
          : BILLING_SYNC_RETRY_MESSAGE,
      );
    }
  })();

  inFlight = { userId: params.userId, forceRefresh, promise };
  try {
    return await promise;
  } finally {
    if (inFlight?.promise === promise) {
      inFlight = null;
    }
  }
}

export function assertPurchaseAllowed(
  eligibility: Pick<BillingEligibilityResult, "hasPaidPro">,
): void {
  if (eligibility.hasPaidPro) {
    throw new Error(ALREADY_HAVE_PRO_MESSAGE);
  }
}
