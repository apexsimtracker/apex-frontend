import { describe, expect, it } from "vitest";
import {
  APPLE_BURNED_PRODUCT_IDS,
  APPLE_PRO_ANNUAL,
  APPLE_PRO_MONTHLY,
  APPLE_SUBSCRIPTION_GROUP,
  PLAY_PRO_ANNUAL,
  PLAY_PRO_MONTHLY,
  STORE_PRO_ANNUAL,
  STORE_PRO_MONTHLY,
  proProductId,
} from "./storeProductIds";

describe("storeProductIds", () => {
  it("keeps one standard pair; only Apple annual is _v2", () => {
    expect(STORE_PRO_MONTHLY).toBe("apex_pro_monthly");
    expect(STORE_PRO_ANNUAL).toBe("apex_pro_annual");

    expect(PLAY_PRO_MONTHLY).toBe(STORE_PRO_MONTHLY);
    expect(PLAY_PRO_ANNUAL).toBe(STORE_PRO_ANNUAL);
    expect(APPLE_PRO_MONTHLY).toBe(STORE_PRO_MONTHLY);
    expect(APPLE_PRO_ANNUAL).toBe("apex_pro_annual_v2");

    expect(proProductId("play", "annual")).toBe(STORE_PRO_ANNUAL);
    expect(proProductId("web", "annual")).toBe(STORE_PRO_ANNUAL);
    expect(proProductId("apple", "annual")).toBe(APPLE_PRO_ANNUAL);
    expect(proProductId("apple", "monthly")).toBe(STORE_PRO_MONTHLY);

    expect(APPLE_SUBSCRIPTION_GROUP).toBe("Apex Pro");
    expect(APPLE_BURNED_PRODUCT_IDS).toEqual([
      "apex_pro_annual",
      "apex_pro_yearly",
    ]);
  });
});
