import {
  TRACK_IMAGE_ALLOWED_MIMES,
  TRACK_IMAGE_MAX_BYTES,
} from "@/lib/api/adminCatalog";

export type TrackImageValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/** Client-side MIME + size gate before upload / decode. */
export function validateTrackImageFile(
  file: Pick<File, "type" | "size">,
): TrackImageValidationResult {
  const mime = (file.type || "").toLowerCase();
  if (!(TRACK_IMAGE_ALLOWED_MIMES as readonly string[]).includes(mime)) {
    return {
      ok: false,
      message: "Invalid file type. Allowed: JPEG, PNG, WebP.",
    };
  }
  if (file.size > TRACK_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      message: `File too large. Maximum size is ${TRACK_IMAGE_MAX_BYTES / 1024 / 1024}MB.`,
    };
  }
  return { ok: true };
}

/** True when hero should use the uploaded catalog image (non-empty URL). */
export function shouldShowTrackHeroImage(
  trackImageUrl: string | null | undefined,
  imageFailed = false,
): boolean {
  return Boolean(trackImageUrl?.trim()) && !imageFailed;
}
