import { useEffect, useMemo, useRef, useState } from "react";
import type { ChallengeApiStatus } from "@/lib/api";

type UseChallengeLiveStateOptions = {
  status?: ChallengeApiStatus | null;
  startsAt?: string | null;
  endsAt?: string | null;
  /** Called once when a start/end boundary is crossed while the page is open. */
  onBoundaryCrossed?: () => void;
};

/**
 * Tracks local countdown from ISO targets and triggers a callback when
 * UPCOMING→ACTIVE or ACTIVE→ENDED boundaries are crossed.
 */
export function useChallengeLiveState({
  status,
  startsAt,
  endsAt,
  onBoundaryCrossed,
}: UseChallengeLiveStateOptions) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const crossedRef = useRef(false);
  const callbackRef = useRef(onBoundaryCrossed);
  callbackRef.current = onBoundaryCrossed;

  const countdownTargetIso = useMemo(() => {
    if (!status) return null;
    if (status === "UPCOMING" && startsAt) return startsAt;
    if (status === "ACTIVE" && endsAt) return endsAt;
    return null;
  }, [status, startsAt, endsAt]);

  useEffect(() => {
    crossedRef.current = false;
  }, [status, startsAt, endsAt, countdownTargetIso]);

  useEffect(() => {
    if (!countdownTargetIso || status === "ENDED") return;

    const id = window.setInterval(() => {
      const nextNow = Date.now();
      setNowMs(nextNow);
      const targetMs = new Date(countdownTargetIso).getTime();
      if (!Number.isFinite(targetMs)) return;
      if (targetMs - nextNow <= 0 && !crossedRef.current) {
        crossedRef.current = true;
        callbackRef.current?.();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [countdownTargetIso, status]);

  const countdownMs = useMemo(() => {
    if (!countdownTargetIso) return null;
    const t = new Date(countdownTargetIso).getTime();
    if (!Number.isFinite(t)) return null;
    return Math.max(0, t - nowMs);
  }, [countdownTargetIso, nowMs]);

  const timeRemainingSec =
    countdownMs != null ? Math.max(0, Math.floor(countdownMs / 1000)) : null;

  return {
    countdownTargetIso,
    timeRemainingSec,
    nowMs,
  };
}

/** React Query refetch interval for challenge list/detail while transitions are possible. */
export function challengeLiveRefetchIntervalMs(
  status?: ChallengeApiStatus | null,
): number | false {
  if (status === "ACTIVE") return 15_000;
  if (status === "UPCOMING") return 30_000;
  return false;
}
