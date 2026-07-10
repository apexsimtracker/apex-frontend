export const CHALLENGE_DEFAULT_COVER_PATH =
  "/screens/img/silverstone-challenge.jpg";

/** Resolve stored cover URL or fall back to bundled default hero image. */
export function resolveChallengeCoverUrl(
  stored: string | null | undefined,
): string {
  const trimmed = stored?.trim();
  return trimmed || CHALLENGE_DEFAULT_COVER_PATH;
}
