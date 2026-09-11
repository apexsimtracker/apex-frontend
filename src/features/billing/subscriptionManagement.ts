import type { BillingStore } from "./billingStore";
import { normalizeBillingStores } from "./billingStore";
import {
  nativeSubscriptionManagementUrl,
} from "./nativeSubscriptionManagement";

export const ALREADY_HAVE_PRO_MESSAGE = "You already have Pro";

export const BILLING_SYNC_RETRY_MESSAGE =
  "Could not verify your subscription status. Check your connection and try again.";

export const UNKNOWN_BILLING_SOURCE_MESSAGE =
  "We could not determine where your Pro subscription is billed. Manage it in iPhone Settings → Subscriptions, Google Play → Payments & subscriptions, or on the Apex website (Stripe portal).";

export type SubscriptionManageAction =
  | {
      id: "app_store";
      kind: "external_url";
      label: string;
      url: string;
      description: string;
    }
  | {
      id: "play_store";
      kind: "external_url";
      label: string;
      url: string;
      description: string;
    }
  | {
      id: "web_portal";
      kind: "web_portal";
      label: string;
      description: string;
    }
  | {
      id: "unknown";
      kind: "instructions";
      label: string;
      description: string;
    };

function hasWebBillingStore(stores: BillingStore[]): boolean {
  return stores.includes("STRIPE") || stores.includes("REVENUECAT_WEB");
}

/**
 * Source-aware manage destinations from server `billingStores`.
 * Never infers a paid source from the current device platform.
 * Stripe + RevenueCat Web collapse to one website/portal action.
 */
export function resolveSubscriptionManageActions(
  stores: BillingStore[] | null | undefined,
  options?: { hasPaidPro?: boolean },
): SubscriptionManageAction[] {
  const normalized = normalizeBillingStores(stores);
  const actions: SubscriptionManageAction[] = [];

  if (normalized.includes("APP_STORE")) {
    actions.push({
      id: "app_store",
      kind: "external_url",
      label: "Manage on App Store",
      url: nativeSubscriptionManagementUrl("apple"),
      description:
        "Your Pro subscription is billed through Apple. Cancel or change it in App Store subscriptions.",
    });
  }

  if (normalized.includes("PLAY_STORE")) {
    actions.push({
      id: "play_store",
      kind: "external_url",
      label: "Manage on Google Play",
      url: nativeSubscriptionManagementUrl("play"),
      description:
        "Your Pro subscription is billed through Google Play. Cancel or change it in Play subscriptions.",
    });
  }

  if (hasWebBillingStore(normalized)) {
    actions.push({
      id: "web_portal",
      kind: "web_portal",
      label: "Manage on website",
      description:
        "Your Pro subscription is billed on the web (Stripe). Open the customer portal to cancel or change it.",
    });
  }

  // An unknown source must remain visible even when another known store exists;
  // otherwise a mixed known/unknown double subscription could be hidden.
  if (
    normalized.includes("UNKNOWN") ||
    (actions.length === 0 && options?.hasPaidPro === true)
  ) {
    actions.push({
      id: "unknown",
      kind: "instructions",
      label: "How to manage Pro",
      description: UNKNOWN_BILLING_SOURCE_MESSAGE,
    });
  }

  return actions;
}

export function paidProHeadline(hasPaidPro: boolean): string {
  return hasPaidPro ? ALREADY_HAVE_PRO_MESSAGE : "You're on Apex Pro";
}

/** Restore stays useful on native for receipts / new devices, including paid Pro. */
export function shouldShowNativeRestore(params: {
  isNative: boolean;
  isLoggedIn: boolean;
  isBillingEnabled: boolean;
}): boolean {
  return params.isNative && params.isLoggedIn && params.isBillingEnabled;
}
