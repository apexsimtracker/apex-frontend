import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Offerings,
  Package as RevenueCatPackage,
  Purchases,
} from "@revenuecat/purchases-js";
import { useAuth } from "@/contexts/AuthContext";
import {
  createBillingPortalSession,
  getBillingConfig,
  refreshBillingSubscription,
  type BillingConfigResponse,
} from "@/lib/api";
import { openExternalUrl } from "@/lib/capacitor/openExternalUrl";

const BILLING_CONFIG_QUERY_KEY = ["billing", "config"] as const;

let configuredApiKey: string | null = null;
let configuredAppUserId: string | null = null;

export type PurchasePackageOutcome = {
  refreshErrorMessage: string | null;
};

function formatRefreshSyncWarning(error: unknown): string {
  const detail =
    error instanceof Error && error.message.trim()
      ? ` ${error.message.trim()}`
      : "";
  return (
    "Your purchase completed, but we could not refresh your subscription status yet." +
    `${detail} Access should update shortly after RevenueCat syncs, or after you refresh the page.`
  );
}

async function ensureRevenueCatReady(params: {
  config: BillingConfigResponse;
  userId: string;
  email?: string | null;
}): Promise<Purchases> {
  const { config, userId, email } = params;
  const apiKey = config.revenueCatPublicApiKey;

  if (!config.enabled || !apiKey) {
    throw new Error("Billing is not configured for this environment.");
  }

  const { Purchases, LogLevel } = await import(
    /* webpackChunkName: "revenuecat" */ "@revenuecat/purchases-js"
  );

  Purchases.setLogLevel(LogLevel.Silent);

  let purchases: Purchases;
  if (!Purchases.isConfigured() || configuredApiKey !== apiKey) {
    purchases = Purchases.configure(apiKey, userId);
    configuredApiKey = apiKey;
    configuredAppUserId = userId;
  } else {
    purchases = Purchases.getSharedInstance();
    if (configuredAppUserId !== userId) {
      await purchases.changeUser(userId);
      configuredAppUserId = userId;
    }
  }

  if (email) {
    try {
      await purchases.setAttributes({ $email: email });
    } catch {
      // Attribute sync is a best-effort enrichment for support/debugging.
    }
  }

  void purchases.preload().catch(() => undefined);
  return purchases;
}

function useBillingConfigQuery(enabled: boolean) {
  return useQuery({
    queryKey: BILLING_CONFIG_QUERY_KEY,
    queryFn: getBillingConfig,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

/** Loads RevenueCat only when Pricing (or another purchase UI) mounts. */
export function useRevenueCat() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  // GET /api/billing/config is public, so fetch it even for logged-out users.
  // This lets the pricing page show the correct sign-in CTA and billing-mode
  // note instead of a stale "not configured"/"loading" message.
  const billingConfigQuery = useBillingConfigQuery(true);

  const offeringsQuery = useQuery({
    queryKey: [
      "billing",
      "revenuecat",
      "offerings",
      user?.id ?? null,
      billingConfigQuery.data?.mode ?? null,
    ],
    queryFn: async (): Promise<Offerings> => {
      const purchases = await ensureRevenueCatReady({
        config: billingConfigQuery.data as BillingConfigResponse,
        userId: user?.id as string,
        email: user?.email ?? null,
      });
      return purchases.getOfferings();
    },
    enabled:
      Boolean(user?.id) &&
      Boolean(billingConfigQuery.data?.enabled) &&
      Boolean(billingConfigQuery.data?.revenueCatPublicApiKey),
    staleTime: 60 * 1000,
    retry: false,
  });

  const refreshMutation = useMutation({
    mutationFn: refreshBillingSubscription,
    onSuccess: async () => {
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (
      rcPackage: RevenueCatPackage,
    ): Promise<PurchasePackageOutcome> => {
      const purchases = await ensureRevenueCatReady({
        config: billingConfigQuery.data as BillingConfigResponse,
        userId: user?.id as string,
        email: user?.email ?? null,
      });

      await purchases.purchasePackage(rcPackage, user?.email ?? undefined);

      try {
        await refreshMutation.mutateAsync();
        return { refreshErrorMessage: null };
      } catch (error) {
        return {
          refreshErrorMessage: formatRefreshSyncWarning(error),
        };
      }
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const { url } = await createBillingPortalSession();
      await openExternalUrl(url);
      return url;
    },
  });

  const availablePackages =
    offeringsQuery.data?.current?.availablePackages ?? [];

  return {
    billingConfig: billingConfigQuery.data ?? null,
    billingConfigQuery,
    offeringsQuery,
    availablePackages,
    purchasePackage: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
    refreshSubscription: refreshMutation.mutateAsync,
    isRefreshingSubscription: refreshMutation.isPending,
    openBillingPortal: portalMutation.mutateAsync,
    isOpeningBillingPortal: portalMutation.isPending,
    portalError: portalMutation.error,
  };
}
