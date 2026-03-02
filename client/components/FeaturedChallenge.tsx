import { useNavigate } from "react-router-dom";
import SimBadge from "./SimBadge";

interface FeaturedChallengeProps {
  id: string;
  title: string;
  track: string;
  car: string;
  game: string;
  fastestLap: string;
  targetTime: string;
  participants: number;
  status: "Live" | "Upcoming" | "Finished";
  timeRemaining?: string;
  position?: number;
  yourLap?: string;
  joined?: boolean;
  onJoin?: (id: string) => void;
  joiningId?: string | null;
}

export default function FeaturedChallenge({
  id,
  title,
  track,
  car,
  game,
  fastestLap,
  targetTime,
  participants,
  status,
  timeRemaining,
  position,
  yourLap,
  joined = false,
  onJoin,
  joiningId,
}: FeaturedChallengeProps) {
  const navigate = useNavigate();

  const statusColor = {
    Live: "text-yellow-200",
    Upcoming: "text-blue-200",
    Finished: "text-muted-foreground/50",
  };

  const statusBg = {
    Live: "bg-yellow-500/10",
    Upcoming: "bg-blue-500/10",
    Finished: "bg-white/5",
  };

  return (
    <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 overflow-hidden mb-8 sm:mb-12">
      {/* Status Bar */}
      <div
        className={`${statusBg[status]} border-b border-white/3 px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${status === "Live" ? "bg-yellow-200 animate-pulse" : status === "Upcoming" ? "bg-blue-200" : "bg-white/30"}`}
          />
          <p
            className={`text-xs font-semibold uppercase tracking-widest ${statusColor[status]}`}
          >
            {status}
          </p>
        </div>
        {timeRemaining && (
          <p className="text-xs text-white/60 hidden sm:block">
            {timeRemaining}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-5 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Left: Challenge Info */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              {title}
            </h2>

            <div className="space-y-3 sm:space-y-5 mb-5 sm:mb-8">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1 sm:mb-2">
                  SIM
                </p>
                <SimBadge sim={game} size="md" />
              </div>

              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1 sm:mb-2">
                  Track
                </p>
                <p className="text-sm sm:text-base text-white font-medium">
                  {track}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1 sm:mb-2">
                  Vehicle
                </p>
                <p className="text-sm sm:text-base text-white font-medium">
                  {car}
                </p>
              </div>

              <div className="hidden sm:block">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                  Target Time
                </p>
                <p className="text-lg text-white font-semibold">{targetTime}</p>
              </div>
            </div>

            {/* CTA Button */}
            {status === "Finished" ? (
              <button
                onClick={() => navigate(`/challenge/${id}`)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg text-sm sm:text-base font-semibold transition-colors"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              >
                View Results
              </button>
            ) : (
              <button
                type="button"
                disabled={joined || joiningId === id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onJoin?.(id);
                }}
                className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg text-sm sm:text-base font-semibold transition-colors ${joined ? "opacity-60 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              >
                {joined
                  ? "Joined"
                  : joiningId === id
                    ? "Joining…"
                    : "Join Challenge"}
              </button>
            )}
          </div>

          {/* Right: Performance Info */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Leaderboard Preview */}
            <div className="bg-white/3 rounded-lg p-3 sm:p-4">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-2 sm:mb-3">
                Fastest Lap
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {fastestLap}
              </p>
            </div>

            {/* Your Lap */}
            {yourLap && (
              <div className="bg-white/3 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1 sm:mb-2">
                  Your Best
                </p>
                <p className="text-lg sm:text-xl font-semibold text-white">
                  {yourLap}
                </p>
                <div className="mt-2 sm:mt-3 w-full bg-white/5 rounded-full h-1">
                  <div
                    className="rounded-full h-1"
                    style={{
                      width: "68%",
                      backgroundColor: "rgb(240, 28, 28)",
                    }}
                  />
                </div>
                {position && (
                  <p
                    className="text-xs font-semibold mt-2 sm:mt-3"
                    style={{ color: "rgb(240, 28, 28)" }}
                  >
                    Your position: #{position}
                  </p>
                )}
              </div>
            )}

            {/* Participant Count */}
            <div className="flex items-center gap-2 mt-auto pt-2 sm:pt-4">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex-shrink-0"
                  />
                ))}
              </div>
              <p className="text-xs text-white/60">
                <span className="text-white font-semibold">{participants}</span>{" "}
                <span className="hidden sm:inline">drivers competing</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
