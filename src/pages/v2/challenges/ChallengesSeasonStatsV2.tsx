import { cn } from "@/lib/utils";
import type { ChallengesMeta } from "@/lib/api";

interface ChallengesSeasonStatsV2Props {
  meta: ChallengesMeta | null;
  yourRank: number | null;
}

export default function ChallengesSeasonStatsV2({
  meta,
  yourRank,
}: ChallengesSeasonStatsV2Props) {
  return (
    <section className="border-y border-v2-outline-variant/15 py-5">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant sm:text-left">
            Open challenges
          </p>
          <span className="font-v2-headline text-3xl font-extrabold tabular-nums leading-none text-v2-on-surface">
            {meta?.activeChallenges ?? "—"}
          </span>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Upcoming + active
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 border-y border-v2-outline-variant/15 py-6 sm:border-x sm:border-y-0 sm:py-0">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant">
            Your rank
          </p>
          <span
            className={cn(
              "font-v2-headline text-3xl font-extrabold tabular-nums leading-none",
              yourRank != null ? "text-v2-primary" : "text-v2-on-surface",
            )}
          >
            {yourRank != null ? `#${yourRank}` : "Unranked"}
          </span>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Overall wins leaderboard
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end sm:text-right">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant sm:text-right">
            Joined
          </p>
          <span className="font-v2-headline text-3xl font-extrabold tabular-nums leading-none text-v2-on-surface">
            {meta?.joinedThisSeason ?? "—"}
          </span>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Challenge joins
          </p>
        </div>
      </div>
    </section>
  );
}
