/** Client-side avatar upload helpers shared by Profile edit and Settings Account. */

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (matches API)

export function withCacheBust(url: string, stamp: number): string {
  return `${url}${url.includes("?") ? "&" : "?"}t=${stamp}`;
}

export function stripQuery(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const idx = url.indexOf("?");
  return idx >= 0 ? url.slice(0, idx) : url;
}

export async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Invalid image file."));
    };
    img.src = objectUrl;
  });
}

export function validateAvatarFile(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Please choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}
