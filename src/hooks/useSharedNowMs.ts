import { useEffect, useState } from "react";

/**
 * Single shared 1s clock for challenge browse countdowns.
 * Prefer this over per-row timers when multiple cards are visible.
 */
export function useSharedNowMs(enabled: boolean): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return nowMs;
}

/** Seconds remaining until ISO target; null when target missing/invalid. */
export function secondsRemainingUntil(
  targetIso: string | null | undefined,
  nowMs: number,
): number | null {
  if (!targetIso) return null;
  const t = new Date(targetIso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((t - nowMs) / 1000));
}
