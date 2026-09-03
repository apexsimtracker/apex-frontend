import type { StoreBillingPlatform } from "./storeProductIds";
import { openExternalUrl } from "@/lib/capacitor/openExternalUrl";

const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";
const PLAY_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions?package=com.apexsimtracker.app";

export function nativeSubscriptionManagementUrl(
  platform: StoreBillingPlatform,
): string {
  if (platform === "apple") return APPLE_SUBSCRIPTIONS_URL;
  if (platform === "play") return PLAY_SUBSCRIPTIONS_URL;
  throw new Error("Native subscription management is unavailable on web.");
}

export async function openNativeSubscriptionManagement(
  platform: StoreBillingPlatform,
): Promise<void> {
  await openExternalUrl(nativeSubscriptionManagementUrl(platform));
}
