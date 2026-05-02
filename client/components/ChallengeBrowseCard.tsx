import { Link } from "react-router-dom";
import { Clock, Users, UserRound } from "lucide-react";
import SimBadge from "@/components/SimBadge";
import { formatLapMs } from "@/lib/utils";
import { formatChallengeDateTime } from "@/lib/datetime";
import type { ChallengeApiStatus, ChallengeListItem } from "@/lib/api";

function statusLabel(status: ChallengeApiStatus): "Live" | "Upcoming" | "Finished" {
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

interface ChallengeBrowseCardProps {
  item: ChallengeListItem;
  isLoggedIn: boolean;
  onJoin?: (id: string) => void;
  joiningId?: string | null;
}

export default function ChallengeBrowseCard({
  item,
  isLoggedIn,
  onJoin,
  joiningId,
}: ChallengeBrowseCardProps) {
  const label = statusLabel(item.status);
  const statusStyle = {
    Live: "text-yellow-200 bg-yellow-500/10 border-yellow-500/20",
    Upcoming: "text-blue-200 bg-blue-500/10 border-blue-500/20",
    Finished: "text-white/50 bg-white/5 border-white/5",
  };

  const best =
    item.fastestLapMs != null ? formatLapMs(item.fastestLapMs) : "—";
  const yourLap =
    item.yourBestLapMs != null ? formatLapMs(item.yourBestLapMs) : null;
  const timeRemaining =
    item.timeRemainingSec != null && item.status === "ACTIVE"
      ? (() => {
          const s = Math.max(0, Math.floor(item.timeRemainingSec));
          const h = Math.floor(s / 3600);
          const m = Math.floor((s % 3600) / 60);
          return `${h}h ${m}m left`;
        })()
      : null;

  const social =
    isLoggedIn &&
    (item.followedWhoJoined.length > 0 || item.followedWhoJoinedMoreCount > 0);
  const previewNames = item.followedWhoJoined.map((u) => u.displayName);
  const extra = item.followedWhoJoinedMoreCount;

  const isJoining = joiningId === item.id;
  const canJoin =
    onJoin && label !== "Finished" && item.status !== "ENDED";

  return (
    <div className="border-white/6 group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card/20 backdrop-blur-lg transition-all duration-300 hover:bg-card/30 hover:shadow-lg hover:shadow-black/20">
      <Link
        to={`/challenge/${item.id}`}
        className="flex min-h-0 flex-1 flex-col p-4 sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-primary">
            {item.title}
          </h3>
          <span
            className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${statusStyle[label]}`}
          >
            {label}
          </span>
        </div>

        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SimBadge sim={item.sim} size="md" />
          </div>
          <p className="line-clamp-1 text-xs text-white/60">{item.track}</p>
          <p className="line-clamp-1 text-xs text-white/50">{item.carClass}</p>
        </div>

        <div className="mb-3 space-y-1 border-t border-white/5 pt-3 text-[11px] text-white/45 sm:text-xs">
          <p>
            <span className="text-white/35">Starts </span>
            {formatChallengeDateTime(item.startsAt)}
          </p>
          <p>
            <span className="text-white/35">Ends </span>
            {formatChallengeDateTime(item.endsAt)}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 shrink-0" aria-hidden />
            {item.participants}
          </span>
          <span className="font-medium text-white/80">Best {best}</span>
          {timeRemaining && (
            <span className="inline-flex items-center gap-1 text-yellow-200/90">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {timeRemaining}
            </span>
          )}
        </div>

        {isLoggedIn && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 text-xs">
            {item.joined && (
              <span className="rounded bg-white/10 px-2 py-0.5 font-medium text-white/80">
                Joined
              </span>
            )}
            {yourLap && (
              <span className="text-white/55">
                Your lap{" "}
                <span className="font-semibold text-white">{yourLap}</span>
              </span>
            )}
            {item.yourPosition != null && (
              <span className="font-medium text-primary">
                #{item.yourPosition}
              </span>
            )}
          </div>
        )}

        {social && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-primary/10 px-2.5 py-2 text-[11px] leading-snug text-primary/95 ring-1 ring-primary/25">
            <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              <span className="font-semibold text-primary">People you follow: </span>
              {previewNames.join(", ")}
              {extra > 0 ? ` +${extra} more` : ""}
            </span>
          </div>
        )}
      </Link>

      {canJoin && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 sm:px-5">
          <button
            type="button"
            disabled={item.joined || isJoining}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJoin(item.id);
            }}
            className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              item.joined || isJoining ? "cursor-not-allowed opacity-60" : ""
            }`}
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            {item.joined ? "Joined" : isJoining ? "Joining…" : "Join"}
          </button>
        </div>
      )}
    </div>
  );
}
