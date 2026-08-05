import type { QueryClient } from "@tanstack/react-query";
import type {
  ChallengeDetail,
  ChallengeListItem,
} from "@/lib/api/challenges";

export function challengeDetailQueryKey(id: string, userKey: string) {
  return ["challenges", "detail", id, userKey] as const;
}

/** Seed detail cache from a browse list row so hero can paint immediately. */
export function seedChallengeDetailFromListItem(
  queryClient: QueryClient,
  item: ChallengeListItem,
  userKey: string,
): void {
  const key = challengeDetailQueryKey(item.id, userKey);
  if (queryClient.getQueryData(key)) return;

  const seeded: ChallengeDetail = {
    id: item.id,
    title: item.title,
    sim: item.sim,
    track: item.track,
    vehicle: item.vehicle,
    carClass: item.carClass,
    kind: "challenge",
    status: item.status,
    participants: item.participants,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    targetTimeMs: item.targetTimeMs,
    yourBestLapMs: item.yourBestLapMs,
    fastestLapMs: item.fastestLapMs,
    yourPosition: item.yourPosition,
    timeRemainingSec: item.timeRemainingSec,
    joined: item.joined,
    followedWhoJoined: item.followedWhoJoined,
    followedWhoJoinedMoreCount: item.followedWhoJoinedMoreCount,
    coverImageUrl: item.coverImageUrl ?? null,
    description: null,
  };
  queryClient.setQueryData(key, seeded);
}
