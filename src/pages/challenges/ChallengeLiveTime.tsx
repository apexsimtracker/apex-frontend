import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useChallengeLiveState } from "@/hooks/useChallengeLiveState";
import type { ChallengeApiStatus } from "@/lib/api/challenges";

const ChallengeLiveTimeContext = createContext<number | null>(null);

/**
 * Owns the 1s live clock so only countdown consumers re-render, not the whole detail page.
 */
export function ChallengeLiveTimeProvider({
  status,
  startsAt,
  endsAt,
  onBoundaryCrossed,
  children,
}: {
  status: ChallengeApiStatus | string | null | undefined;
  startsAt: string | null | undefined;
  endsAt: string | null | undefined;
  onBoundaryCrossed?: () => void;
  children: ReactNode;
}) {
  const { timeRemainingSec } = useChallengeLiveState({
    status: status as ChallengeApiStatus | null | undefined,
    startsAt,
    endsAt,
    onBoundaryCrossed,
  });
  return (
    <ChallengeLiveTimeContext.Provider value={timeRemainingSec}>
      {children}
    </ChallengeLiveTimeContext.Provider>
  );
}

export function useChallengeLiveTimeSec(): number | null {
  return useContext(ChallengeLiveTimeContext);
}
