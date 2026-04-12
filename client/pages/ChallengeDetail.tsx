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
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <button
            onClick={() => navigate("/challenges")}
            className="mb-8 flex items-center gap-2 rounded-lg border border-white/20 bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80"
          >
            <ArrowLeft className="size-4" />
            Return
          </button>
          <p className="py-8 text-muted-foreground">Missing challenge ID</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-muted-foreground">Loading challenge…</p>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <button
            onClick={() => navigate("/challenges")}
            className="mb-8 flex items-center gap-2 rounded-lg border border-white/20 bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80"
          >
            <ArrowLeft className="size-4" />
            Return
          </button>
          <p className="py-8 text-muted-foreground">{error ?? "Challenge not found."}</p>
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/challenges")}
          className="mb-8 flex items-center gap-2 rounded-lg border border-white/20 bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80"
        >
          <ArrowLeft className="size-4" />
          Return
        </button>

        {/* Header */}
        <div className="mb-8">
          <div
            className={`mb-4 inline-block rounded px-3 py-1 text-xs font-semibold ${
              status === "Live"
                ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-200"
                : status === "Upcoming"
                  ? "border border-blue-500/20 bg-blue-500/10 text-blue-200"
                  : "border border-white/10 bg-white/5 text-white/50"
            }`}
          >
            {status}
          </div>
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
            {challenge.title}
          </h1>
          <p className="text-sm text-muted-foreground/70">
            {challenge.description ?? "No description."}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column - Challenge Info */}
          <div className="md:col-span-2">
            <div className="border-white/6 mb-8 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
                Challenge Details
              </h2>

              <div className="mb-8 grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                    Game
                  </p>
                  <p className="text-base font-medium text-white">{formatSimEnum(challenge.sim)}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                    Track
                  </p>
                  <p className="text-base font-medium text-white">{challenge.track}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                    Vehicle
                  </p>
                  <p className="text-base font-medium text-white">
                    {formatCarName(challenge.vehicle)}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                    Target
                  </p>
                  <p className="text-base font-medium text-white">
                    {challenge.targetTimeMs != null
                      ? formatLapMs(challenge.targetTimeMs)
                      : "—"}
                  </p>
                </div>
              </div>

              {challenge.rules && challenge.rules.length > 0 && (
                <div className="border-white/3 border-t pt-6">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Rules
                  </h3>
                  <ul className="space-y-2">
                    {challenge.rules.map((rule: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-white/70"
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
            <div className="border-white/6 sticky top-20 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
                Your Performance
              </h2>

              <div className="space-y-6">
                {challenge.yourPosition != null ? (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                      Position
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "rgb(240, 28, 28)" }}
                    >
                      #{challenge.yourPosition}
                    </p>
                    <p className="mt-2 text-xs text-white/60">
                      of {challenge.participants} drivers
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                      Status
                    </p>
                    <p className="text-sm font-medium text-white">{status}</p>
                    {timeRemaining && (
                      <p className="mt-2 text-xs text-white/60">{timeRemaining}</p>
                    )}
                  </div>
                )}

                {challenge.yourBestLapMs != null && (
                  <div className="bg-white/3 rounded-lg p-4">
                    <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
                      Your Best
                    </p>
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-white">
                        {formatLapMs(challenge.yourBestLapMs)}
                      </p>
                      {challenge.fastestLapMs != null &&
                        challenge.yourBestLapMs - challenge.fastestLapMs > 0 && (
                          <p className="mt-1 text-xs text-white/60">
                            +{" "}
                            {formatLapDelta(
                              challenge.yourBestLapMs - challenge.fastestLapMs
                            )}
                          </p>
                        )}
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/5">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: "68%",
                          backgroundColor: "rgb(240, 28, 28)",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-white/3 rounded-lg p-4">
                  <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
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
        <div className="border-white/6 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
            Standings
          </h2>
          <p className="py-4 text-sm text-muted-foreground">
            No standings data yet.
          </p>
        </div>
      </div>
    </div>
  );
}
