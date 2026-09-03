import { describe, expect, it } from "vitest";
import {
  billingPlatformForCapacitorPlatform,
  nativeRevenueCatApiKey,
} from "./billingPlatform";

describe("billingPlatform", () => {
  it("maps Capacitor platforms to their billing stores", () => {
    expect(billingPlatformForCapacitorPlatform("ios")).toBe("apple");
    expect(billingPlatformForCapacitorPlatform("android")).toBe("play");
    expect(billingPlatformForCapacitorPlatform("web")).toBe("web");
  });

  it("selects app-specific native public SDK keys", () => {
    const environment = {
      VITE_REVENUECAT_IOS_API_KEY: " appl_public ",
      VITE_REVENUECAT_ANDROID_API_KEY: "goog_public",
    };

    expect(nativeRevenueCatApiKey("apple", environment)).toBe("appl_public");
    expect(nativeRevenueCatApiKey("play", environment)).toBe("goog_public");
    expect(nativeRevenueCatApiKey("web", environment)).toBeNull();
  });
});
