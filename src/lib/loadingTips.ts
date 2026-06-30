/** Delay before status lines and tips appear (short loads stay minimal). */
export const LOADING_EXTENDED_DELAY_MS = 3000;

/** How long each tip/status stays visible once extended content is shown. */
export const LOADING_ROTATE_MS = 5000;

/** Logo display size on loading screens (matches boot splash inline CSS). h-16 = 64px. */
export const LOADING_LOGO_HEIGHT_PX = 64;
export const LOADING_LOGO_MAX_WIDTH_PX = Math.round(112 * (64 / 40));

/** Rotating status lines shown once extended loading content appears. */
export const LOADING_STATUS_LINES = [
  "Warming up…",
  "Checking session…",
  "Loading telemetry…",
  "Syncing lap data…",
  "Preparing your garage…",
] as const;

/** Game-style tips shown while the app loads. Derived from FAQ and onboarding copy. */
export const LOADING_TIPS = [
  "Log sessions manually or let Apex Agent auto-upload them with Pro.",
  "Apex Analysis breaks down sector pace, consistency, and weekly trends on your home feed.",
  "Join community challenges to compare lap times on the same track and car.",
  "Your session data and telemetry are private by default — you control what is shared.",
  "Track progress across iRacing, F1 25, and more simulators in one place.",
  "Upload session files from your simulator or enter results with manual activity logging.",
  "Weekly goals and snapshots on your home feed help you stay consistent between races.",
  "Leaderboards rank drivers by lap time — filter by sim, track, and car.",
  "Follow other drivers in the community to see their activity in your home feed.",
  "Personal bests and sector breakdowns help you find time left on track.",
  "Free accounts include the last 3 months of session history, community, and challenges.",
  "Set weekly race and track-time goals from your profile to build a steady rhythm.",
  "Session detail pages show stint pace, fuel, tyres, and coaching insights.",
  "Challenges are open to everyone — Pro members get priority when lap times are close.",
  "Use privacy settings to choose what appears on your public driver profile.",
  "Consistency beats one hot lap — Apex tracks both pace and repeatability.",
] as const;

export function pickRandomIndex(length: number, seed?: number): number {
  if (length <= 0) return 0;
  if (seed != null) return Math.abs(seed) % length;
  return Math.floor(Math.random() * length);
}

export function pickRandomTip(seed?: number): string {
  return (
    LOADING_TIPS[pickRandomIndex(LOADING_TIPS.length, seed)] ?? LOADING_TIPS[0]
  );
}

export function pickRandomStatusLine(seed?: number): string {
  return (
    LOADING_STATUS_LINES[pickRandomIndex(LOADING_STATUS_LINES.length, seed)] ??
    LOADING_STATUS_LINES[0]
  );
}
