import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Package as WebRevenueCatPackage,
  Purchases as WebPurchases,
} from "@revenuecat/purchases-js";
import type { PurchasesPackage as NativeRevenueCatPackage } from "@revenuecat/purchases-capacitor";
import { useAuth } from "@/contexts/AuthContext";
import {
  createBillingPortalSession,
  getBillingConfig,
  refreshBillingSubscription,
  type BillingConfigResponse,
} from "@/lib/api";
import { openExternalUrl } from "@/lib/capacitor/openExternalUrl";
import type { BillingPackage } from "./billingPackage";
import {
  currentBillingPlatform,
  nativeRevenueCatApiKey,
} from "./billingPlatform";
import { openNativeSubscriptionManagement } from "./nativeSubscriptionManagement";

const BILLING_CONFIG_QUERY_KEY = ["billing", "config"] as const;

let configuredWebApiKey: string | null = null;
let configuredWebAppUserId: string | null = null;
let configuredNativeApiKey: string | null = null;

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

function webProductDetails(rcPackage: WebRevenueCatPackage): {
  productIdentifier: string;
  priceString: string | null;
  title: string | null;
} {
  const product = rcPackage.webBillingProduct as unknown as
    Record<string, unknown> | undefined;
  const productIdentifier =
    typeof product?.identifier === "string"
      ? product.identifier
      : rcPackage.identifier;
  const priceString =
    typeof product?.priceString === "string"
      ? product.priceString
      : typeof product?.currentPriceString === "string"
        ? product.currentPriceString
        : typeof product?.formattedPrice === "string"
          ? product.formattedPrice
          : null;
  const title =
    typeof product?.displayName === "string"
      ? product.displayName
      : typeof product?.title === "string"
        ? product.title
        : null;
  return { productIdentifier, priceString, title };
}

function normalizeWebPackage(rcPackage: WebRevenueCatPackage): BillingPackage {
  return {
    sdk: "web",
    identifier: rcPackage.identifier,
    ...webProductDetails(rcPackage),
    rawPackage: rcPackage,
  };
}

function normalizeNativePackage(
  rcPackage: NativeRevenueCatPackage,
): BillingPackage {
  return {
    sdk: "native",
    identifier: rcPackage.identifier,
    productIdentifier: rcPackage.product.identifier,
    priceString: rcPackage.product.priceString,
    title: rcPackage.product.title,
    rawPackage: rcPackage,
  };
}

async function ensureWebRevenueCatReady(params: {
  config: BillingConfigResponse;
  userId: string;
  email?: string | null;
}): Promise<WebPurchases> {
  const { config, userId, email } = params;
  const apiKey = config.revenueCatPublicApiKey;

  if (!config.enabled || !apiKey) {
    throw new Error("Billing is not configured for this environment.");
  }

  const { Purchases, LogLevel } = await import(
    /* webpackChunkName: "revenuecat-web" */ "@revenuecat/purchases-js"
  );

  Purchases.setLogLevel(LogLevel.Silent);

  let purchases: WebPurchases;
  if (!Purchases.isConfigured() || configuredWebApiKey !== apiKey) {
    purchases = Purchases.configure(apiKey, userId);
    configuredWebApiKey = apiKey;
    configuredWebAppUserId = userId;
  } else {
    purchases = Purchases.getSharedInstance();
    if (configuredWebAppUserId !== userId) {
      await purchases.changeUser(userId);
      configuredWebAppUserId = userId;
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

async function ensureNativeRevenueCatReady(params: {
  apiKey: string;
  userId: string;
  email?: string | null;
}) {
  const { apiKey, userId, email } = params;
  const { Purchases, LOG_LEVEL } = await import(
    /* webpackChunkName: "revenuecat-native" */ "@revenuecat/purchases-capacitor"
  );
  await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });

  const { isConfigured } = await Purchases.isConfigured();
  if (!isConfigured) {
    await Purchases.configure({ apiKey, appUserID: userId });
    configuredNativeApiKey = apiKey;
  } else {
    if (configuredNativeApiKey && configuredNativeApiKey !== apiKey) {
      throw new Error(
        "RevenueCat was already configured with a different native app key.",
      );
    }
    configuredNativeApiKey = apiKey;
    const { appUserID } = await Purchases.getAppUserID();
    if (appUserID !== userId) {
      await Purchases.logIn({ appUserID: userId });
    }
  }

  if (email) {
    try {
      await Purchases.setEmail({ email });
    } catch {
      // Attribute sync is a best-effort enrichment for support/debugging.
    }
  }

  return Purchases;
}

function useBillingConfigQuery(enabled: boolean) {
  return useQuery({
    queryKey: BILLING_CONFIG_QUERY_KEY,
    queryFn: getBillingConfig,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

/** Loads the platform-appropriate RevenueCat SDK only when purchase UI mounts. */
export function useRevenueCat() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const billingPlatform = currentBillingPlatform();
  const isNative = billingPlatform !== "web";
  const nativeApiKey = nativeRevenueCatApiKey(billingPlatform);
  const billingConfigQuery = useBillingConfigQuery(true);
  const isBillingEnabled = isNative
    ? Boolean(nativeApiKey)
    : Boolean(
        billingConfigQuery.data?.enabled &&
        billingConfigQuery.data.revenueCatPublicApiKey,
      );

  const offeringsQuery = useQuery({
    queryKey: [
      "billing",
      "revenuecat",
      "offerings",
      billingPlatform,
      user?.id ?? null,
      billingConfigQuery.data?.mode ?? null,
    ],
    queryFn: async (): Promise<BillingPackage[]> => {
      if (isNative) {
        const purchases = await ensureNativeRevenueCatReady({
          apiKey: nativeApiKey as string,
          userId: user?.id as string,
          email: user?.email ?? null,
        });
        const offerings = await purchases.getOfferings();
        return (
          offerings.current?.availablePackages.map(normalizeNativePackage) ?? []
        );
      }

      const purchases = await ensureWebRevenueCatReady({
        config: billingConfigQuery.data as BillingConfigResponse,
        userId: user?.id as string,
        email: user?.email ?? null,
      });
      const offerings = await purchases.getOfferings();
      return (
        offerings.current?.availablePackages.map(normalizeWebPackage) ?? []
      );
    },
    enabled: Boolean(user?.id) && isBillingEnabled,
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

  async function refreshAfterStoreAction(): Promise<PurchasePackageOutcome> {
    try {
      await refreshMutation.mutateAsync();
      return { refreshErrorMessage: null };
    } catch (error) {
      return { refreshErrorMessage: formatRefreshSyncWarning(error) };
    }
  }

  const purchaseMutation = useMutation({
    mutationFn: async (
      rcPackage: BillingPackage,
    ): Promise<PurchasePackageOutcome> => {
      if (rcPackage.sdk === "native") {
        const purchases = await ensureNativeRevenueCatReady({
          apiKey: nativeApiKey as string,
          userId: user?.id as string,
          email: user?.email ?? null,
        });
        await purchases.purchasePackage({ aPackage: rcPackage.rawPackage });
      } else {
        const purchases = await ensureWebRevenueCatReady({
          config: billingConfigQuery.data as BillingConfigResponse,
          userId: user?.id as string,
          email: user?.email ?? null,
        });
        await purchases.purchasePackage(
          rcPackage.rawPackage,
          user?.email ?? undefined,
        );
      }

      return refreshAfterStoreAction();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (): Promise<PurchasePackageOutcome> => {
      if (!isNative || !nativeApiKey || !user?.id) {
        throw new Error(
          "Restore purchases is only available in the mobile app.",
        );
      }
      const purchases = await ensureNativeRevenueCatReady({
        apiKey: nativeApiKey,
        userId: user.id,
        email: user.email ?? null,
      });
      await purchases.restorePurchases();
      return refreshAfterStoreAction();
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      if (isNative) {
        await openNativeSubscriptionManagement(billingPlatform);
        return null;
      }
      const { url } = await createBillingPortalSession();
      await openExternalUrl(url);
      return url;
    },
  });

  return {
    billingConfig: billingConfigQuery.data ?? null,
    billingConfigQuery,
    billingPlatform,
    isNative,
    isBillingEnabled,
    offeringsQuery,
    availablePackages: offeringsQuery.data ?? [],
    purchasePackage: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
    restorePurchases: restoreMutation.mutateAsync,
    isRestoringPurchases: restoreMutation.isPending,
    restoreError: restoreMutation.error,
    refreshSubscription: refreshMutation.mutateAsync,
    isRefreshingSubscription: refreshMutation.isPending,
    openBillingPortal: portalMutation.mutateAsync,
    isOpeningBillingPortal: portalMutation.isPending,
    portalError: portalMutation.error,
  };
}
