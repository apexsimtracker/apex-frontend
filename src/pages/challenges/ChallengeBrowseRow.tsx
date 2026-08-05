import { Link } from "react-router-dom";
import { memo, useCallback } from "react";
import { UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { appPrimaryButtonClassName } from "@/components/app-ui/appButtonClasses";
import { formatSimEnum } from "@/lib/enumFormat";
import { formatChallengeDateTime, formatChallengeTimeRemaining } from "@/lib/datetime";
import { cn, formatCarName, formatLapMs, formatTrackName } from "@/lib/utils";
import type { ChallengeApiStatus, ChallengeListItem } from "@/lib/api/challenges";
import { secondsRemainingUntil } from "@/hooks/useSharedNowMs";
import { useAuth } from "@/contexts/AuthContext";
import { preloadChallengeDetail } from "@/routes/routePreload";
import { seedChallengeDetailFromListItem } from "@/lib/challenges/challengeDetailPrefetch";

type BrowseTab = "upcoming" | "live" | "past" | "joined";

interface ChallengeBrowseRowProps {
  item: ChallengeListItem;
  activeTab: BrowseTab;
  isLoggedIn: boolean;
  onJoin?: (id: string) => void;
  joiningId?: string | null;
  detailTo?: string;
  showStatusChip?: boolean;
  /** Shared page clock (ms) for live countdown. */
  nowMs?: number;
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
    "border-apex-outline-variant/15 bg-apex-surface-container-high text-apex-on-surface-variant",
};

function ChallengeRowTimeDisplay({
  item,
  activeTab,
  nowMs,
}: {
  item: ChallengeListItem;
  activeTab: BrowseTab;
  nowMs: number;
}) {
  if (activeTab === "upcoming") {
    return (
      <p className="mt-1 font-apex-body text-[11px] text-apex-on-surface-variant">
        Starts {formatChallengeDateTime(item.startsAt)}
      </p>
    );
  }

  if (activeTab === "live") {
    const fromClock = secondsRemainingUntil(item.endsAt, nowMs);
    const remaining =
      fromClock ??
      (item.timeRemainingSec != null
        ? Math.max(0, Math.floor(item.timeRemainingSec))
        : null);
    return (
      <p className="mt-1 font-apex-body text-[11px] text-apex-on-surface-variant">
        Ends {formatChallengeDateTime(item.endsAt)}
        {remaining != null && (
          <>
            {" "}
            ·{" "}
            <span className="font-medium text-apex-on-surface">
              {formatChallengeTimeRemaining(remaining)} left
            </span>
          </>
        )}
      </p>
    );
  }

  if (activeTab === "past") {
    return (
      <p className="mt-1 font-apex-body text-[11px] text-apex-on-surface-variant">
        {formatChallengeDateTime(item.startsAt)} –{" "}
        {formatChallengeDateTime(item.endsAt)}
      </p>
    );
  }

  return null;
}

function ChallengeBrowseRow({
  item,
  activeTab,
  isLoggedIn,
  onJoin,
  joiningId,
  detailTo,
  showStatusChip = false,
  nowMs = Date.now(),
}: ChallengeBrowseRowProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const linkTo = detailTo ?? `/challenge/${item.id}`;
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

  const warmDetail = useCallback(() => {
    void preloadChallengeDetail();
    seedChallengeDetailFromListItem(
      queryClient,
      item,
      user?.id?.trim() || "anon",
    );
  }, [queryClient, item, user?.id]);

  return (
    <article className="overflow-hidden rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container transition-colors hover:bg-apex-surface-container-high">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={linkTo}
          className="min-w-0 flex-1"
          onMouseEnter={warmDetail}
          onFocus={warmDetail}
          onPointerDown={warmDetail}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-apex-headline text-sm font-bold text-apex-on-surface transition-colors hover:text-apex-primary">
              {item.title}
            </h3>
            {showStatusChip && (
              <span
                className={cn(
                  "shrink-0 rounded-apex-sm border px-2 py-0.5 font-apex-headline text-[10px] font-semibold uppercase tracking-wide",
                  STATUS_CHIP_CLASS[label],
                )}
              >
                {label}
              </span>
            )}
          </div>
          <p className="mt-1 font-apex-body text-[11px] font-medium text-apex-on-surface-variant">
            <span>{formatSimEnum(item.sim)}</span>
            <span className="mx-1.5 text-apex-outline-variant">/</span>
            <span>{formatTrackName(item.track)}</span>
            <span className="mx-1.5 text-apex-outline-variant">/</span>
            <span className="text-apex-on-surface">
              {item.participants.toLocaleString()} drivers
            </span>
            {item.carClass && (
              <>
                <span className="mx-1.5 text-apex-outline-variant">/</span>
                <span>{formatCarName(item.carClass)}</span>
              </>
            )}
          </p>
          <ChallengeRowTimeDisplay
            item={item}
            activeTab={activeTab}
            nowMs={nowMs}
          />
          {social && (
            <p className="mt-2 flex items-start gap-1.5 font-apex-body text-[11px] text-apex-primary">
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
              <div className="text-right font-apex-body text-xs text-apex-on-surface-variant">
                {yourLap && (
                  <span>
                    Your lap{" "}
                    <span className="font-semibold text-apex-on-surface">
                      {yourLap}
                    </span>
                  </span>
                )}
                {item.yourPosition != null && (
                  <span
                    className={cn(
                      "font-medium text-apex-primary",
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
                appPrimaryButtonClassName,
                "px-5 py-2 text-xs normal-case tracking-normal sm:w-auto",
                isJoining && "cursor-not-allowed opacity-60",
              )}
            >
              {isJoining ? "Joining…" : "Join"}
            </button>
          )}

          {item.joined &&
            !(isLoggedIn && (yourLap || item.yourPosition != null)) && (
              <span className="rounded-apex-sm bg-apex-surface-container-high px-4 py-2 text-center font-apex-body text-xs font-semibold text-apex-on-surface">
                Joined
              </span>
            )}
        </div>
      </div>
    </article>
  );
}

export default memo(ChallengeBrowseRow);
