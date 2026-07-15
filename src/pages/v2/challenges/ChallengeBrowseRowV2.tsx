import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { v2PrimaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { formatSimEnum } from "@/lib/enumFormat";
import { formatChallengeDateTime, formatChallengeTimeRemaining } from "@/lib/datetime";
import { cn, formatCarName, formatLapMs, formatTrackName } from "@/lib/utils";
import type { ChallengeApiStatus, ChallengeListItem } from "@/lib/api";
import { useChallengeLiveState } from "@/hooks/useChallengeLiveState";

type BrowseTab = "upcoming" | "live" | "past" | "joined";

interface ChallengeBrowseRowV2Props {
  item: ChallengeListItem;
  activeTab: BrowseTab;
  isLoggedIn: boolean;
  onJoin?: (id: string) => void;
  joiningId?: string | null;
  detailTo?: string;
  showStatusChip?: boolean;
}

function statusLabel(
  status: ChallengeApiStatus,
): "Live" | "Upcoming" | "Finished" {
  switch (status) {
    case "ACTIVE":
      return "Live";
    case "UPCOMING":
      return "Upcoming";
    case "ENDED":
      return "Finished";
    default:
      return "Finished";
  }
}

const STATUS_CHIP_CLASS: Record<ReturnType<typeof statusLabel>, string> = {
  Live: "border-yellow-500/20 bg-yellow-500/10 text-yellow-200",
  Upcoming: "border-blue-500/20 bg-blue-500/10 text-blue-200",
  Finished:
    "border-v2-outline-variant/15 bg-v2-surface-container-high text-v2-on-surface-variant",
};

function ChallengeRowTimeDisplay({
  item,
  activeTab,
}: {
  item: ChallengeListItem;
  activeTab: BrowseTab;
}) {
  const { timeRemainingSec } = useChallengeLiveState({
    status: item.status,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
  });

  if (activeTab === "upcoming") {
    return (
      <p className="mt-1 font-v2-body text-[11px] text-v2-on-surface-variant">
        Starts {formatChallengeDateTime(item.startsAt)}
      </p>
    );
  }

  if (activeTab === "live") {
    const remaining =
      timeRemainingSec ??
      (item.timeRemainingSec != null
        ? Math.max(0, Math.floor(item.timeRemainingSec))
        : null);
    return (
      <p className="mt-1 font-v2-body text-[11px] text-v2-on-surface-variant">
        Ends {formatChallengeDateTime(item.endsAt)}
        {remaining != null && (
          <>
            {" "}
            ·{" "}
            <span className="font-medium text-v2-on-surface">
              {formatChallengeTimeRemaining(remaining)} left
            </span>
          </>
        )}
      </p>
    );
  }

  if (activeTab === "past") {
    return (
      <p className="mt-1 font-v2-body text-[11px] text-v2-on-surface-variant">
        {formatChallengeDateTime(item.startsAt)} –{" "}
        {formatChallengeDateTime(item.endsAt)}
      </p>
    );
  }

  return null;
}

export default function ChallengeBrowseRowV2({
  item,
  activeTab,
  isLoggedIn,
  onJoin,
  joiningId,
  detailTo,
  showStatusChip = false,
}: ChallengeBrowseRowV2Props) {
  const linkTo = detailTo ?? `/v2/challenge/${item.id}`;
  const label = statusLabel(item.status);
  const isJoining = joiningId === item.id;
  const canJoin = onJoin && item.status !== "ENDED";
  const social =
    isLoggedIn &&
    (item.followedWhoJoined.length > 0 || item.followedWhoJoinedMoreCount > 0);
  const previewNames = item.followedWhoJoined.map((u) => u.displayName);
  const extra = item.followedWhoJoinedMoreCount;
  const yourLap =
    item.yourBestLapMs != null ? formatLapMs(item.yourBestLapMs) : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container transition-colors hover:bg-v2-surface-container-high">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to={linkTo} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-v2-headline text-sm font-bold text-v2-on-surface transition-colors hover:text-v2-primary">
              {item.title}
            </h3>
            {showStatusChip && (
              <span
                className={cn(
                  "shrink-0 rounded-v2-sm border px-2 py-0.5 font-v2-headline text-[10px] font-semibold uppercase tracking-wide",
                  STATUS_CHIP_CLASS[label],
                )}
              >
                {label}
              </span>
            )}
          </div>
          <p className="mt-1 font-v2-body text-[11px] font-medium text-v2-on-surface-variant">
            <span>{formatSimEnum(item.sim)}</span>
            <span className="mx-1.5 text-v2-outline-variant">/</span>
            <span>{formatTrackName(item.track)}</span>
            <span className="mx-1.5 text-v2-outline-variant">/</span>
            <span className="text-v2-on-surface">
              {item.participants.toLocaleString()} drivers
            </span>
            {item.carClass && (
              <>
                <span className="mx-1.5 text-v2-outline-variant">/</span>
                <span>{formatCarName(item.carClass)}</span>
              </>
            )}
          </p>
          <ChallengeRowTimeDisplay item={item} activeTab={activeTab} />
          {social && (
            <p className="mt-2 flex items-start gap-1.5 font-v2-body text-[11px] text-v2-primary">
              <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-1">
                <span className="font-semibold">People you follow: </span>
                {previewNames.join(", ")}
                {extra > 0 ? ` +${extra} more` : ""}
              </span>
            </p>
          )}
        </Link>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          {isLoggedIn &&
            item.joined &&
            (yourLap || item.yourPosition != null) && (
              <div className="text-right font-v2-body text-xs text-v2-on-surface-variant">
                {yourLap && (
                  <span>
                    Your lap{" "}
                    <span className="font-semibold text-v2-on-surface">
                      {yourLap}
                    </span>
                  </span>
                )}
                {item.yourPosition != null && (
                  <span
                    className={cn(
                      "font-medium text-v2-primary",
                      yourLap && "ml-2",
                    )}
                  >
                    #{item.yourPosition}
                  </span>
                )}
              </div>
            )}

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
                "px-5 py-2 text-xs normal-case tracking-normal sm:w-auto",
                isJoining && "cursor-not-allowed opacity-60",
              )}
            >
              {isJoining ? "Joining…" : "Join"}
            </button>
          )}

          {item.joined &&
            !(isLoggedIn && (yourLap || item.yourPosition != null)) && (
              <span className="rounded-v2-sm bg-v2-surface-container-high px-4 py-2 text-center font-v2-body text-xs font-semibold text-v2-on-surface">
                Joined
              </span>
            )}
        </div>
      </div>
    </article>
  );
}
