import { Link } from "react-router-dom";
import { Clock, Users } from "lucide-react";
import SimBadge from "./SimBadge";

interface ChallengeCardProps {
  id: string;
  title: string;
  track: string;
  car: string;
  game: string;
  status: "Live" | "Upcoming" | "Finished";
  participants: number;
  timeRemaining?: string;
  fastestLap: string;
  yourPosition?: number;
  joined?: boolean;
  onJoin?: (id: string) => void;
  joiningId?: string | null;
}

export default function ChallengeCard({
  id,
  title,
  track,
  car,
  game,
  status,
  participants,
  timeRemaining,
  fastestLap,
  yourPosition,
  joined = false,
  onJoin,
  joiningId,
}: ChallengeCardProps) {
  const isJoining = joiningId === id;
  const statusColor = {
    Live: "text-yellow-200 bg-yellow-500/10 border-yellow-500/20",
    Upcoming: "text-blue-200 bg-blue-500/10 border-blue-500/20",
    Finished: "text-white/50 bg-white/5 border-white/5",
  };

  return (
    <Link to={`/challenge/${id}`}>
      <div className="border-white/6 group cursor-pointer overflow-hidden rounded-lg border bg-card/20 backdrop-blur-lg transition-all duration-300 hover:bg-card/30 active:bg-card/35">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5">
          {/* Left: Title and Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white transition-colors group-hover:text-primary">
                {title}
              </h3>
            </div>

            <div className="mb-3 space-y-1 text-xs text-white/50">
              <div className="mb-1 flex items-center gap-2">
                <SimBadge sim={game} size="md" />
              </div>
              <p>{track}</p>
              <p>{car}</p>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Users className="size-3.5" />
                <span className="font-medium">{participants}</span>
              </div>

              {timeRemaining && (
                <div className="hidden items-center gap-1.5 text-xs text-white/60 sm:flex">
                  <Clock className="size-3.5" />
                  <span>{timeRemaining}</span>
                </div>
              )}

              <div
                className={`rounded border px-2 py-0.5 text-xs font-semibold ${statusColor[status]}`}
              >
                {status}
              </div>
            </div>
          </div>

          {/* Right: Key Metric + Join */}
          <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:gap-0">
            <div className="flex flex-col items-end">
              <p className="mb-1 hidden text-xs uppercase text-white/50 sm:block">
                Best
              </p>
              <p className="text-base font-bold text-white">{fastestLap}</p>
            </div>

            {yourPosition != null && (
              <p className="text-xs font-medium text-primary sm:mt-2">
                #{yourPosition}
              </p>
            )}

            {status !== "Finished" && onJoin && (
              <button
                type="button"
                disabled={joined || isJoining}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onJoin(id);
                }}
                className={`mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${joined ? "cursor-not-allowed opacity-60" : ""}`}
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              >
                {joined ? "Joined" : isJoining ? "Joining…" : "Join"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
