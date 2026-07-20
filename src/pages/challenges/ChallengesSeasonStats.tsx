import { cn } from "@/lib/utils";
import type { ChallengesMeta } from "@/lib/api";

interface ChallengesSeasonStatsProps {
  meta: ChallengesMeta | null;
  yourRank: number | null;
}

export default function ChallengesSeasonStats({
  meta,
  yourRank,
}: ChallengesSeasonStatsProps) {
  return (
    <section className="border-y border-apex-outline-variant/15 py-5">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-apex-on-surface-variant sm:text-left">
            Open challenges
          </p>
          <span className="font-apex-headline text-3xl font-extrabold tabular-nums leading-none text-apex-on-surface">
            {meta?.activeChallenges ?? "—"}
          </span>
          <p className="font-apex-body text-xs text-apex-on-surface-variant">
            Upcoming + active
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 border-y border-apex-outline-variant/15 py-6 sm:border-x sm:border-y-0 sm:py-0">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-apex-on-surface-variant">
            Your rank
          </p>
          <span
            className={cn(
              "font-apex-headline text-3xl font-extrabold tabular-nums leading-none",
              yourRank != null ? "text-apex-primary" : "text-apex-on-surface",
            )}
          >
            {yourRank != null ? `#${yourRank}` : "Unranked"}
          </span>
          <p className="font-apex-body text-xs text-apex-on-surface-variant">
            Overall wins leaderboard
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end sm:text-right">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-apex-on-surface-variant sm:text-right">
            Joined
          </p>
          <span className="font-apex-headline text-3xl font-extrabold tabular-nums leading-none text-apex-on-surface">
            {meta?.joinedThisSeason ?? "—"}
          </span>
          <p className="font-apex-body text-xs text-apex-on-surface-variant">
            Challenge joins
          </p>
        </div>
      </div>
    </section>
  );
}
