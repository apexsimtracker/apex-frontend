import { Capacitor } from "@capacitor/core";
import type { StoreBillingPlatform } from "./storeProductIds";

type PublicEnvironment = Record<string, string | boolean | undefined>;

export function billingPlatformForCapacitorPlatform(
  platform: string,
): StoreBillingPlatform {
  if (platform === "ios") return "apple";
  if (platform === "android") return "play";
  return "web";
}

export function currentBillingPlatform(): StoreBillingPlatform {
  if (!Capacitor.isNativePlatform()) return "web";
  return billingPlatformForCapacitorPlatform(Capacitor.getPlatform());
}

export function nativeRevenueCatApiKey(
  platform: StoreBillingPlatform,
  environment: PublicEnvironment = import.meta.env,
): string | null {
  const raw =
    platform === "apple"
      ? environment.VITE_REVENUECAT_IOS_API_KEY
      : platform === "play"
        ? environment.VITE_REVENUECAT_ANDROID_API_KEY
        : null;

  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}
