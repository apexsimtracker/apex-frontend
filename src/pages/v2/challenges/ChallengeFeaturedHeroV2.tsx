import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { v2PrimaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { formatSimEnum } from "@/lib/enumFormat";
import { resolveChallengeCoverUrl } from "@/lib/challenges/coverImage";
import { cn, formatCarName, formatLapMs, formatTrackName } from "@/lib/utils";
import { formatChallengeDateTime, formatChallengeTimeRemaining } from "@/lib/datetime";
import type { ChallengeListItem } from "@/lib/api";
import { useChallengeLiveState } from "@/hooks/useChallengeLiveState";

interface ChallengeFeaturedHeroV2Props {
  item: ChallengeListItem;
  onJoin?: (id: string) => void;
  joiningId?: string | null;
  detailTo?: string;
}

function thirdStatLabel(item: ChallengeListItem): string {
  if (item.targetTimeMs != null) return "Target time";
  if (item.fastestLapMs != null) return "Best lap";
  return "Drivers";
}

function thirdStatValue(item: ChallengeListItem): string {
  if (item.targetTimeMs != null) return formatLapMs(item.targetTimeMs);
  if (item.fastestLapMs != null) return formatLapMs(item.fastestLapMs);
  return String(item.participants);
}

export default function ChallengeFeaturedHeroV2({
  item,
  onJoin,
  joiningId,
  detailTo,
}: ChallengeFeaturedHeroV2Props) {
  const linkTo = detailTo ?? `/v2/challenge/${item.id}`;
  const isJoining = joiningId === item.id;
  const canJoin = onJoin && item.status !== "ENDED";
  const { timeRemainingSec } = useChallengeLiveState({
    status: item.status,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container">
      <Link to={linkTo} className="block">
        <div className="relative h-48 overflow-hidden sm:h-56">
          <img
            src={resolveChallengeCoverUrl(item.coverImageUrl)}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-v2-background via-transparent to-black/20" />
          <div className="absolute left-4 top-4 flex items-center gap-1 rounded-v2-sm bg-v2-primary px-2 py-0.5 font-v2-body text-[10px] font-black uppercase text-white">
            <span className="size-1 animate-pulse rounded-full bg-white" />
            Live
          </div>
          {item.status === "ACTIVE" && timeRemainingSec != null && (
            <div className="absolute right-4 top-4 font-v2-body text-[11px] font-medium text-v2-on-surface">
              Ends {formatChallengeDateTime(item.endsAt)}
              <span className="ml-1 font-bold">
                · {formatChallengeTimeRemaining(timeRemainingSec)} left
              </span>
            </div>
          )}
          <div className="absolute inset-x-6 bottom-6">
            <h2 className="font-v2-headline text-2xl font-bold tracking-tight text-v2-on-surface sm:text-3xl">
              {item.title}
            </h2>
            <p className="mt-1 line-clamp-1 font-v2-body text-sm text-v2-on-surface-variant">
              {formatTrackName(item.track)} · {formatCarName(item.carClass)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-6 pb-0">
          <div>
            <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
              Sim
            </p>
            <p className="font-v2-body text-sm font-bold text-v2-on-surface">
              {formatSimEnum(item.sim)}
            </p>
          </div>
          <div>
            <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
              Track
            </p>
            <p className="font-v2-body text-sm font-bold text-v2-on-surface">
              {formatTrackName(item.track)}
            </p>
          </div>
          <div>
            <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
              {thirdStatLabel(item)}
            </p>
            <p className="font-v2-body text-sm font-bold text-v2-on-surface">
              {thirdStatValue(item)}
            </p>
          </div>
        </div>
      </Link>

      <div className="p-6 pt-4">
        {canJoin && !item.joined && (
          <button
            type="button"
            disabled={isJoining}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJoin(item.id);
            }}
            className={cn(
              v2PrimaryButtonClassName,
              "flex w-full items-center justify-center gap-2 py-3.5 normal-case tracking-normal active:scale-[0.98]",
              isJoining && "cursor-not-allowed opacity-60",
            )}
          >
            {isJoining ? "Joining…" : "Join challenge"}
          </button>
        )}

        {item.joined && (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-v2-outline-variant/20 bg-v2-surface-container-high py-3.5 font-v2-body text-sm font-bold uppercase tracking-wider text-v2-on-surface">
            <CheckCircle className="size-5 text-v2-primary" aria-hidden />
            Joined
          </div>
        )}
      </div>
    </section>
  );
}
