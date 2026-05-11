import { describe, it, expect } from "vitest";
import {
  REFERENCE_URLS,
  catalogSimKeyToManualActivitySim,
  reviewCatalogReferenceUrl,
  reviewCatalogSearchUrl,
  reviewCatalogOrphanSearchUrl,
} from "./catalogAdminReviewUrls";

describe("catalogAdminReviewUrls", () => {
  it("maps API sim keys to ManualActivitySim", () => {
    expect(catalogSimKeyToManualActivitySim("iracing")).toBe("IRACING");
    expect(catalogSimKeyToManualActivitySim("IRACING")).toBe("IRACING");
    expect(catalogSimKeyToManualActivitySim("f1_25")).toBe("F1_25");
    expect(catalogSimKeyToManualActivitySim("lmu")).toBe("LMU");
    expect(catalogSimKeyToManualActivitySim("")).toBeNull();
    expect(catalogSimKeyToManualActivitySim("unknown")).toBeNull();
  });

  it("reviewCatalogReferenceUrl returns configured URLs", () => {
    expect(reviewCatalogReferenceUrl({ sim: "IRACING", kind: "track" })).toBe(
      REFERENCE_URLS.IRACING.track
    );
    expect(reviewCatalogReferenceUrl({ sim: "IRACING", kind: "car" })).toBe(
      REFERENCE_URLS.IRACING.car
    );
    expect(reviewCatalogReferenceUrl({ sim: "LMU", kind: "track" })).toBe(
      REFERENCE_URLS.LMU.track
    );
  });

  it("reviewCatalogSearchUrl encodes query", () => {
    const u = reviewCatalogSearchUrl("hello world");
    expect(u.startsWith("https://www.google.com/search?q=")).toBe(true);
    expect(decodeURIComponent(u.split("q=")[1] ?? "")).toBe("hello world");
  });

  it("reviewCatalogOrphanSearchUrl includes token and kind", () => {
    const u = reviewCatalogOrphanSearchUrl("spa", "track");
    expect(u).toContain(encodeURIComponent("spa"));
    expect(u).toContain("track");
  });
});
