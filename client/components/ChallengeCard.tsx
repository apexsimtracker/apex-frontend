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
      <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 overflow-hidden hover:bg-card/30 active:bg-card/35 transition-all duration-300 cursor-pointer group">
        <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          {/* Left: Title and Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">
                {title}
              </h3>
            </div>

            <div className="text-xs text-white/50 mb-3 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <SimBadge sim={game} size="md" />
              </div>
              <p>{track}</p>
              <p>{car}</p>
            </div>

            {/* Meta Row */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium">{participants}</span>
              </div>

              {timeRemaining && (
                <div className="flex items-center gap-1.5 text-xs text-white/60 hidden sm:flex">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeRemaining}</span>
                </div>
              )}

              <div
                className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor[status]}`}
              >
                {status}
              </div>
            </div>
          </div>

          {/* Right: Key Metric + Join */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center flex-shrink-0 gap-3 sm:gap-0">
            <div className="flex flex-col items-end">
              <p className="text-xs text-white/50 uppercase mb-1 hidden sm:block">
                Best
              </p>
              <p className="text-base font-bold text-white">{fastestLap}</p>
            </div>

            {yourPosition != null && (
              <p className="text-xs text-primary font-medium sm:mt-2">
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
                className={`mt-2 px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors ${joined ? "opacity-60 cursor-not-allowed" : ""}`}
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
