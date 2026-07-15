import { describe, expect, it } from "vitest";
import {
  shouldShowTrackHeroImage,
  validateTrackImageFile,
} from "./trackImageValidation";
import { TRACK_IMAGE_MAX_BYTES } from "./api/adminCatalog";

describe("validateTrackImageFile", () => {
  it("accepts JPEG/PNG/WebP under 5MB", () => {
    expect(
      validateTrackImageFile({ type: "image/jpeg", size: 1024 })
    ).toEqual({ ok: true });
    expect(
      validateTrackImageFile({ type: "image/png", size: 2048 })
    ).toEqual({ ok: true });
    expect(
      validateTrackImageFile({ type: "image/webp", size: 4096 })
    ).toEqual({ ok: true });
  });

  it("rejects invalid MIME and oversized files", () => {
    expect(
      validateTrackImageFile({ type: "application/pdf", size: 100 })
    ).toMatchObject({ ok: false });
    expect(
      validateTrackImageFile({
        type: "image/jpeg",
        size: TRACK_IMAGE_MAX_BYTES + 1,
      })
    ).toMatchObject({ ok: false });
  });
});

describe("shouldShowTrackHeroImage", () => {
  it("shows only non-empty URLs that have not failed", () => {
    expect(shouldShowTrackHeroImage("https://cdn/t.jpg")).toBe(true);
    expect(shouldShowTrackHeroImage("  ")).toBe(false);
    expect(shouldShowTrackHeroImage(null)).toBe(false);
    expect(shouldShowTrackHeroImage("https://cdn/t.jpg", true)).toBe(false);
  });
});
