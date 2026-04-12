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
    <div className="border-white/6 mb-8 overflow-hidden rounded-lg border bg-card/20 backdrop-blur-lg sm:mb-12">
      {/* Status Bar */}
      <div
        className={`${statusBg[status]} border-white/3 flex items-center justify-between border-b px-4 py-2 sm:px-6 sm:py-3`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`size-2 rounded-full ${status === "Live" ? "animate-pulse bg-yellow-200" : status === "Upcoming" ? "bg-blue-200" : "bg-white/30"}`}
          />
          <p
            className={`text-xs font-semibold uppercase tracking-widest ${statusColor[status]}`}
          >
            {status}
          </p>
        </div>
        {timeRemaining && (
          <p className="hidden text-xs text-white/60 sm:block">
            {timeRemaining}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-5 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          {/* Left: Challenge Info */}
          <div>
            <h2 className="mb-3 text-xl font-bold leading-tight text-white sm:mb-4 sm:text-2xl md:text-3xl">
              {title}
            </h2>

            <div className="mb-5 space-y-3 sm:mb-8 sm:space-y-5">
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-white/50 sm:mb-2">
                  SIM
                </p>
                <SimBadge sim={game} size="md" />
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-white/50 sm:mb-2">
                  Track
                </p>
                <p className="text-sm font-medium text-white sm:text-base">
                  {track}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-white/50 sm:mb-2">
                  Vehicle
                </p>
                <p className="text-sm font-medium text-white sm:text-base">
                  {car}
                </p>
              </div>

              <div className="hidden sm:block">
                <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                  Target Time
                </p>
                <p className="text-lg font-semibold text-white">{targetTime}</p>
              </div>
            </div>

            {/* CTA Button */}
            {status === "Finished" ? (
              <button
                onClick={() => navigate(`/challenge/${id}`)}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-base"
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
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-base ${joined ? "cursor-not-allowed opacity-60" : ""}`}
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
              <p className="mb-2 text-xs uppercase tracking-widest text-white/50 sm:mb-3">
                Fastest Lap
              </p>
              <p className="text-xl font-bold text-white sm:text-2xl">
                {fastestLap}
              </p>
            </div>

            {/* Your Lap */}
            {yourLap && (
              <div className="bg-white/3 rounded-lg p-3 sm:p-4">
                <p className="mb-1 text-xs uppercase tracking-widest text-white/50 sm:mb-2">
                  Your Best
                </p>
                <p className="text-lg font-semibold text-white sm:text-xl">
                  {yourLap}
                </p>
                <div className="mt-2 h-1 w-full rounded-full bg-white/5 sm:mt-3">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: "68%",
                      backgroundColor: "rgb(240, 28, 28)",
                    }}
                  />
                </div>
                {position && (
                  <p
                    className="mt-2 text-xs font-semibold sm:mt-3"
                    style={{ color: "rgb(240, 28, 28)" }}
                  >
                    Your position: #{position}
                  </p>
                )}
              </div>
            )}

            {/* Participant Count */}
            <div className="mt-auto flex items-center gap-2 pt-2 sm:pt-4">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="size-5 shrink-0 rounded-full border border-white/10 bg-gradient-to-br from-white/20 to-white/5 sm:size-7"
                  />
                ))}
              </div>
              <p className="text-xs text-white/60">
                <span className="font-semibold text-white">{participants}</span>{" "}
                <span className="hidden sm:inline">drivers competing</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
