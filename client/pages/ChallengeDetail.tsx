import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { formatLapDelta, formatCarName, formatLapMs } from "@/lib/utils";
import { getCompetition, getCompetitionSummary, type CompetitionDetail } from "@/lib/api";
import { formatSimEnum } from "@/lib/enumFormat";

const formatRemaining = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m remaining`;
};

function statusLabel(status: CompetitionDetail["status"]): "Live" | "Upcoming" | "Finished" {
  switch (status) {
    case "LIVE":
      return "Live";
    case "UPCOMING":
      return "Upcoming";
    case "FINISHED":
      return "Finished";
    default:
      return "Finished";
  }
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: challenge,
    isPending: loading,
    error: queryError,
    isError,
  } = useQuery({
    queryKey: ["competitions", "detail", id ?? ""],
    queryFn: async () => {
      if (!id) {
        throw new Error("Missing challenge ID");
      }
      let data = await getCompetition(id);
      if (!data) {
        const list = await getCompetitionSummary();
        data = list.find((c) => c.id === id) ?? null;
      }
      if (!data) {
        throw new Error("Challenge not found");
      }
      return data as CompetitionDetail;
    },
    enabled: Boolean(id),
  });

  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load challenge"
    : null;

  if (!id) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <button
            onClick={() => navigate("/challenges")}
            className="flex items-center gap-2 px-4 py-2 bg-black border border-white/20 text-white hover:bg-black/80 transition-all rounded-lg mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Return
          </button>
          <p className="text-muted-foreground py-8">Missing challenge ID</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading challenge…</p>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <button
            onClick={() => navigate("/challenges")}
            className="flex items-center gap-2 px-4 py-2 bg-black border border-white/20 text-white hover:bg-black/80 transition-all rounded-lg mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Return
          </button>
          <p className="text-muted-foreground py-8">{error ?? "Challenge not found."}</p>
        </div>
      </div>
    );
  }

  const status = statusLabel(challenge.status);
  const timeRemaining =
    challenge.timeRemainingSec != null && challenge.status === "LIVE"
      ? formatRemaining(challenge.timeRemainingSec)
      : challenge.status === "UPCOMING" && challenge.startsAt
        ? `Starts ${new Date(challenge.startsAt).toLocaleString()}`
        : null;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Back Button */}
        <button
          onClick={() => navigate("/challenges")}
          className="flex items-center gap-2 px-4 py-2 bg-black border border-white/20 text-white hover:bg-black/80 transition-all rounded-lg mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Return
        </button>

        {/* Header */}
        <div className="mb-8">
          <div
            className={`inline-block px-3 py-1 rounded text-xs font-semibold mb-4 ${
              status === "Live"
                ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-200"
                : status === "Upcoming"
                  ? "bg-blue-500/10 border border-blue-500/20 text-blue-200"
                  : "bg-white/5 border border-white/10 text-white/50"
            }`}
          >
            {status}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {challenge.title}
          </h1>
          <p className="text-muted-foreground/70 text-sm">
            {challenge.description ?? "No description."}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Challenge Info */}
          <div className="md:col-span-2">
            <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-6 mb-8">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6">
                Challenge Details
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Game
                  </p>
                  <p className="text-base text-white font-medium">{formatSimEnum(challenge.sim)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Track
                  </p>
                  <p className="text-base text-white font-medium">{challenge.track}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Vehicle
                  </p>
                  <p className="text-base text-white font-medium">
                    {formatCarName(challenge.vehicle)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Target
                  </p>
                  <p className="text-base text-white font-medium">
                    {challenge.targetTimeMs != null
                      ? formatLapMs(challenge.targetTimeMs)
                      : "—"}
                  </p>
                </div>
              </div>

              {challenge.rules && challenge.rules.length > 0 && (
                <div className="border-t border-white/3 pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Rules
                  </h3>
                  <ul className="space-y-2">
                    {challenge.rules.map((rule: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-white/70 flex items-start gap-3"
                      >
                        <span
                          className="font-bold"
                          style={{ color: "rgb(240, 28, 28)" }}
                        >
                          ✓
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Your Performance */}
          <div>
            <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-6 sticky top-20">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6">
                Your Performance
              </h2>

              <div className="space-y-6">
                {challenge.yourPosition != null ? (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                      Position
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "rgb(240, 28, 28)" }}
                    >
                      #{challenge.yourPosition}
                    </p>
                    <p className="text-xs text-white/60 mt-2">
                      of {challenge.participants} drivers
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                      Status
                    </p>
                    <p className="text-sm text-white font-medium">{status}</p>
                    {timeRemaining && (
                      <p className="text-xs text-white/60 mt-2">{timeRemaining}</p>
                    )}
                  </div>
                )}

                {challenge.yourBestLapMs != null && (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                      Your Best
                    </p>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-white">
                        {formatLapMs(challenge.yourBestLapMs)}
                      </p>
                      {challenge.fastestLapMs != null &&
                        challenge.yourBestLapMs - challenge.fastestLapMs > 0 && (
                          <p className="text-xs text-white/60 mt-1">
                            +{" "}
                            {formatLapDelta(
                              challenge.yourBestLapMs - challenge.fastestLapMs
                            )}
                          </p>
                        )}
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1">
                      <div
                        className="rounded-full h-1"
                        style={{
                          width: "68%",
                          backgroundColor: "rgb(240, 28, 28)",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-white/3 rounded-lg p-4">
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
                    Fastest
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {challenge.fastestLapMs != null
                      ? formatLapMs(challenge.fastestLapMs)
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Standings - no mock data; empty state until backend provides standings API */}
        <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-6">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-6">
            Standings
          </h2>
          <p className="text-sm text-muted-foreground py-4">
            No standings data yet.
          </p>
        </div>
      </div>
    </div>
  );
}
