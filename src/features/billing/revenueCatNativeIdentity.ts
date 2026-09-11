import {
  currentBillingPlatform,
  nativeRevenueCatApiKey,
} from "./billingPlatform";

let configuredNativeApiKey: string | null = null;
let configuredNativeAppUserId: string | null = null;

export function resetNativeRevenueCatIdentityForTests(): void {
  configuredNativeApiKey = null;
  configuredNativeAppUserId = null;
}

export function getConfiguredNativeRevenueCatUserId(): string | null {
  return configuredNativeAppUserId;
}

/**
 * Configure / log in native RevenueCat with Apex `user.id`.
 * Safe to call from Pricing and the global native identity sync.
 */
export async function ensureNativeRevenueCatIdentity(params: {
  userId: string;
  email?: string | null;
  apiKey?: string | null;
}): Promise<typeof import("@revenuecat/purchases-capacitor").Purchases> {
  const platform = currentBillingPlatform();
  const apiKey = params.apiKey ?? nativeRevenueCatApiKey(platform);
  if (!apiKey) {
    throw new Error("Native RevenueCat is not configured for this build.");
  }
  if (platform === "web") {
    throw new Error("Native RevenueCat identity is only available on iOS/Android.");
  }

  const { Purchases, LOG_LEVEL } = await import(
    /* webpackChunkName: "revenuecat-native" */ "@revenuecat/purchases-capacitor"
  );
  await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });

  const { isConfigured } = await Purchases.isConfigured();
  if (!isConfigured) {
    await Purchases.configure({ apiKey, appUserID: params.userId });
    configuredNativeApiKey = apiKey;
    configuredNativeAppUserId = params.userId;
  } else {
    if (configuredNativeApiKey && configuredNativeApiKey !== apiKey) {
      throw new Error(
        "RevenueCat was already configured with a different native app key.",
      );
    }
    configuredNativeApiKey = apiKey;
    const { appUserID } = await Purchases.getAppUserID();
    if (appUserID !== params.userId) {
      await Purchases.logIn({ appUserID: params.userId });
    }
    configuredNativeAppUserId = params.userId;
  }

  if (params.email) {
    try {
      await Purchases.setEmail({ email: params.email });
    } catch {
      // Attribute sync is a best-effort enrichment for support/debugging.
    }
  }

  return Purchases;
}
