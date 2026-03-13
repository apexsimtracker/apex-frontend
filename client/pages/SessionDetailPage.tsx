import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Share2, PenLine, FileText, Pencil, Trash2, Repeat } from "lucide-react";
import { apiGet, deleteManualActivity, ApiError } from "@/lib/api";
import { formatLapMs, formatLapDelta, formatCarName } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import { formatSessionTypeUpper, formatSessionType, getSimDisplayName } from "@/lib/sim";
import SimBadge from "@/components/SimBadge";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SkeletonBlock } from "@/components/ui/skeleton";

type Insight = { title: string; description: string; icon: string };

function buildInsights(session: SessionDetail): Insight[] {
  const insights: Insight[] = [];
  if ((session.lapCount ?? 0) > 0) {
    insights.push({
      title: "Session Completed",
      description: "You completed at least one full lap.",
      icon: "✅",
    });
  }
  if ((session.lapCount ?? 0) >= 3) {
    insights.push({
      title: "Good Track Time",
      description: "You spent meaningful time learning the circuit.",
      icon: "⏱️",
    });
  }
  if (session.bestLapMs && session.bestLapMs < 120000) {
    insights.push({
      title: "Strong Pace",
      description: "Lap time shows competitive speed.",
      icon: "⚡",
    });
  }
  if (insights.length === 0) {
    insights.push({
      title: "Warmup Session",
      description: "No completed laps recorded yet.",
      icon: "🏁",
    });
  }
  return insights;
}

function formatDeltaMs(deltaMs: number): string {
  const s = formatLapDelta(deltaMs);
  return s === "—" ? "—" : `+${s}`;
}

function calcConsistencyScore(lapTimes: number[]): number | null {
  if (lapTimes.length < 3) return null;
  const mean = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
  const variance =
    lapTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) /
    lapTimes.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  const raw = Math.round(100 - cv * 4000);
  return Math.max(0, Math.min(100, raw));
}

function buildShareText(session: SessionDetail): string {
  const type = formatSessionType(session?.sessionType);
  const track = formatTrackName(session?.track);
  const car = session?.vehicleDisplay ?? session?.car ?? "Unknown car";
  const laps = session?.lapCount ?? 0;
  const best = formatLapMs(session?.bestLapMs);
  const lapTimes = (session?.laps ?? []).map((l) => l.timeMs).filter(Boolean);
  const consistency = calcConsistencyScore(lapTimes);
  const consistencyText =
    consistency == null ? "—" : `${consistency}/100`;
  return [
    `Apex — ${type} @ ${track}`,
    `Car: ${car}`,
    `Best: ${best}`,
    `Laps: ${laps}`,
    `Consistency: ${consistencyText}`,
  ].join("\n");
}

type RawLap = {
  lap: number;
  lapNumber?: number;
  timeMs?: number;
  lapTimeMs?: number;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
};

type NormalizedLap = {
  lap: number;
  timeMs: number;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
};

function normalizeLaps(laps: RawLap[] | undefined): NormalizedLap[] {
  if (!laps) return [];
  return laps.map((l) => ({
    lap: l.lapNumber ?? l.lap,
    timeMs: l.lapTimeMs ?? l.timeMs ?? 0,
    sector1Ms: l.sector1Ms,
    sector2Ms: l.sector2Ms,
    sector3Ms: l.sector3Ms,
  }));
}

export type SessionSource = "TELEMETRY" | "MANUAL_ACTIVITY" | "AGENT" | string;

export type SessionDetail = {
  id: string;
  sessionType?: "PRACTICE" | "RACE" | "QUALIFY" | "UNKNOWN" | null;
  sim?: string | null;
  track: string | null;
  trackId?: string | null;
  car: string | null;
  carId?: string | null;
  vehicleDisplay?: string;
  position?: number | null;
  totalDrivers?: number | null;
  bestLapMs?: number | null;
  bestLapLapNumber?: number | null;
  lapCount?: number | null;
  laps?: RawLap[];
  compareToPrevious?: {
    previousSessionId: string;
    bestLapDiffMs: number | null;
    medianLapDiffMs: number | null;
    consistencyDiffPct: number | null;
  } | null;
  processingDurationMs?: number | null;
  source?: SessionSource | null;
  notes?: string | null;
  userId?: string | null;
};

function isManualActivity(session: SessionDetail): boolean {
  if (session.source === "MANUAL_ACTIVITY") return true;
  const hasNoLaps = !session.laps || session.laps.length === 0;
  const hasNoTelemetryFields =
    session.lapCount === 0 ||
    session.lapCount == null ||
    session.bestLapLapNumber == null;
  return hasNoLaps && hasNoTelemetryFields && session.source !== "TELEMETRY" && session.source !== "AGENT";
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllLaps, setShowAllLaps] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiGet<SessionDetail>(`/api/sessions/${id}`)
      .then((data) => {
        setSession(data);
        setError(null);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load session"
        );
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-muted-foreground">Missing session ID.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <SkeletonBlock height={12} width={72} />
              <SkeletonBlock height={24} width={64} rounded="lg" />
            </div>
            <SkeletonBlock height={32} width={280} className="mt-1" rounded="lg" />
          </div>
          <div className="flex gap-2 shrink-0">
            <SkeletonBlock height={40} width={88} rounded="lg" />
            <SkeletonBlock height={40} width={72} rounded="lg" />
          </div>
        </div>
        <div className="grid gap-4 mb-8 grid-cols-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
            >
              <SkeletonBlock height={12} width={64} className="mb-2" />
              <SkeletonBlock height={24} width={48} rounded="lg" />
            </div>
          ))}
        </div>
        <SkeletonBlock
          height={320}
          className="w-full rounded-lg border border-white/10 mb-8"
        />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-8">
          <SkeletonBlock height={200} className="rounded-lg border border-white/10" />
          <SkeletonBlock height={200} className="rounded-lg border border-white/10" />
        </div>
      </div>
    );
  }
  if (error || !session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-muted-foreground">
          {error ?? `Session detail coming soon: ${id}`}
        </p>
      </div>
    );
  }

  const sessionTypeLabel = formatSessionTypeUpper(session.sessionType);
  const laps = normalizeLaps(session.laps);
  const hasNoLaps = session.lapCount === 0 || laps.length === 0;
  const isManual = isManualActivity(session);
  const isOwner = user?.id != null && session.userId === user.id;
  const canEditOrDelete = isManual && isOwner;
  const bestLapMs = session.bestLapMs ?? null;
  const isRace =
    session.sessionType === "RACE" || session.sessionType === "QUALIFY";
  const showPosition = isRace && session.position != null;
  const fastestLapMs =
    laps.length > 0 ? Math.min(...laps.map((l) => l.timeMs)) : null;
  const personalBestMs = fastestLapMs;
  const bestLapMsFromLaps = fastestLapMs;
  const bestS1 = Math.min(...laps.map((l) => l.sector1Ms ?? Infinity));
  const bestS2 = Math.min(...laps.map((l) => l.sector2Ms ?? Infinity));
  const bestS3 = Math.min(...laps.map((l) => l.sector3Ms ?? Infinity));
  const hasSectors = laps.some(
    (l) =>
      l.sector1Ms != null &&
      l.sector2Ms != null &&
      l.sector3Ms != null,
  );
  const bestS1Insights = hasSectors
    ? Math.min(...laps.map((l) => l.sector1Ms ?? Infinity))
    : null;
  const bestS2Insights = hasSectors
    ? Math.min(...laps.map((l) => l.sector2Ms ?? Infinity))
    : null;
  const bestS3Insights = hasSectors
    ? Math.min(...laps.map((l) => l.sector3Ms ?? Infinity))
    : null;
  const idealLapMs =
    hasSectors &&
    bestS1Insights != null &&
    Number.isFinite(bestS1Insights) &&
    bestS2Insights != null &&
    Number.isFinite(bestS2Insights) &&
    bestS3Insights != null &&
    Number.isFinite(bestS3Insights)
      ? bestS1Insights + bestS2Insights + bestS3Insights
      : null;

  function lapColorClass(lapTimeMs: number): string {
    if (fastestLapMs == null) return "text-white";
    if (lapTimeMs === fastestLapMs) return "text-purple-400 font-semibold";
    if (lapTimeMs === personalBestMs) return "text-lime-400 font-semibold";
    return "text-white/80";
  }

  const insights = buildInsights(session);
  const visibleLaps = showAllLaps ? laps : laps.slice(0, 6);
  const canShowMoreLaps = !showAllLaps && laps.length > 6;
  const lapTimes = (session?.laps ?? []).map((l) => l.timeMs).filter(Boolean);
  const consistency = calcConsistencyScore(lapTimes);
  const lapTimesForTrend = laps.map((l) => l.timeMs);
  const trendBestLapMs =
    lapTimesForTrend.length > 0 ? Math.min(...lapTimesForTrend) : null;
  const firstLapMs =
    lapTimesForTrend.length > 0 ? lapTimesForTrend[0] : null;
  const improvementMs =
    firstLapMs != null && trendBestLapMs != null
      ? firstLapMs - trendBestLapMs
      : 0;
  const bestLapLapNumber = session.bestLapLapNumber;

  async function handleDelete() {
    if (!id) return;

    try {
      await deleteManualActivity(id);
      toast({
        title: "Activity deleted",
        description: "The manual activity has been removed.",
      });
      navigate("/");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to delete activity. Please try again.";
      throw new Error(message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs uppercase tracking-wider text-[rgb(240,28,28)]">
              {sessionTypeLabel}
            </p>
            <SimBadge sim={session.sim} />
            {isManual && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium tracking-wide rounded border bg-violet-500/10 text-violet-300 border-violet-500/20">
                <PenLine className="h-3 w-3" />
                Manual
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            {formatTrackName(session.track)}
          </h1>
          {import.meta.env.DEV && session.processingDurationMs != null && (
            <p className="mt-1 text-xs text-white/40">
              Ingestion: {(session.processingDurationMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEditOrDelete && (
            <>
              <button
                type="button"
                onClick={() =>
                  navigate("/manual", {
                    state: {
                      logAgain: {
                        sim: session.sim ?? undefined,
                        trackId: session.trackId ?? undefined,
                        carId: session.carId ?? undefined,
                      },
                    },
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <Repeat className="w-4 h-4" />
                Log Again
              </button>
              <button
                type="button"
                onClick={() => navigate(`/manual/${id}/edit`)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
          {session != null && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
              onClick={async () => {
                const text = buildShareText(session);
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied!" : (
                <>
                  Share
                  <Share2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className={`grid gap-4 mb-8 ${
          showPosition ? "grid-cols-4" : "grid-cols-3"
        }`}
      >
        {showPosition && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
              Position
            </p>
            <p className="text-lg font-semibold text-white">
              P{session.position}
              {session.totalDrivers != null && (
                <span className="text-sm font-normal text-white/60">
                  {" "}
                  / {session.totalDrivers}
                </span>
              )}
            </p>
          </div>
        )}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
            Best Lap
          </p>
          <p className="text-lg font-semibold text-white">
            {formatLapMs(session.bestLapMs)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
            Total Laps
          </p>
          <p className="text-lg font-semibold text-white">
            {hasNoLaps ? 0 : (session.lapCount ?? "—")}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
            Car
          </p>
          <p className="text-lg font-semibold text-white">
            {session.vehicleDisplay ?? formatCarName(session.car)}
          </p>
        </div>
      </div>

      {isManual ? (
        <>
          {/* Manual Activity Details Card */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-white/60" />
              <h2 className="text-lg font-semibold text-white">
                Activity Details
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
                  Sim / Game
                </p>
                <p className="text-sm text-white">
                  {getSimDisplayName(session.sim)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
                  Track
                </p>
                <p className="text-sm text-white">
                  {formatTrackName(session.track)}
                </p>
              </div>
              {(session.vehicleDisplay || session.car) && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
                    Car
                  </p>
                  <p className="text-sm text-white">
                    {session.vehicleDisplay ?? formatCarName(session.car)}
                  </p>
                </div>
              )}
              {session.position != null && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
                    Position
                  </p>
                  <p className="text-sm text-white">
                    P{session.position}
                    {session.totalDrivers != null && (
                      <span className="text-white/60">
                        {" "}/ {session.totalDrivers}
                      </span>
                    )}
                  </p>
                </div>
              )}
              {session.bestLapMs != null && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
                    Best Lap
                  </p>
                  <p className="text-sm text-white font-mono">
                    {formatLapMs(session.bestLapMs)}
                  </p>
                </div>
              )}
            </div>
            {session.notes && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
                  Notes
                </p>
                <p className="text-sm text-white/80 whitespace-pre-wrap">
                  {session.notes}
                </p>
              </div>
            )}
          </div>

          {/* No Telemetry Panel */}
          <div className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-white/40">
              Manual activities don't include telemetry charts.
            </p>
          </div>
        </>
      ) : hasNoLaps ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="text-lg font-semibold text-white">
            No laps recorded
          </h2>
          <p className="mt-2 text-sm text-white/60">
            This session didn&apos;t contain any completed laps.
          </p>
        </div>
      ) : (
        <>
          {bestLapLapNumber != null && (
            <div className="mt-8 mb-2 text-sm text-white/60">
              Best lap was{" "}
              <span className="text-white">Lap {bestLapLapNumber}</span>
              {improvementMs > 0 ? (
                <>
                  {" "}
                  — improved by{" "}
                  <span className="text-white">
                    {formatLapDelta(improvementMs)}
                  </span>{" "}
                  from Lap 1
                </>
              ) : null}
            </div>
          )}

          {/* Ideal Lap — best S1 + S2 + S3 + lap time across like lap table */}
          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wider text-white/50 mb-1.5">
              Ideal Lap
            </div>
            <div className="grid grid-cols-4 gap-2 items-end">
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  S1
                </div>
                <div className="mt-0.5 text-base font-semibold text-purple-400 font-mono">
                  {bestS1Insights != null && Number.isFinite(bestS1Insights)
                    ? formatLapMs(bestS1Insights)
                    : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  S2
                </div>
                <div className="mt-0.5 text-base font-semibold text-purple-400 font-mono">
                  {bestS2Insights != null && Number.isFinite(bestS2Insights)
                    ? formatLapMs(bestS2Insights)
                    : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  S3
                </div>
                <div className="mt-0.5 text-base font-semibold text-purple-400 font-mono">
                  {bestS3Insights != null && Number.isFinite(bestS3Insights)
                    ? formatLapMs(bestS3Insights)
                    : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Time
                </div>
                <div className="mt-0.5 text-base font-semibold text-purple-400 font-mono">
                  {formatLapMs(idealLapMs)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-semibold text-white/60 uppercase tracking-wider py-3 px-4">
                    Lap
                  </th>
                  <th className="text-right text-xs font-semibold text-white/60 uppercase tracking-wider py-3 px-4">
                    S1
                  </th>
                  <th className="text-right text-xs font-semibold text-white/60 uppercase tracking-wider py-3 px-4">
                    S2
                  </th>
                  <th className="text-right text-xs font-semibold text-white/60 uppercase tracking-wider py-3 px-4">
                    S3
                  </th>
                  <th className="text-right text-xs font-semibold text-white/60 uppercase tracking-wider py-3 px-4">
                    Time
                  </th>
                  <th className="text-right text-xs font-semibold text-white/60 uppercase tracking-wider py-3 px-4">
                    DELTA
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleLaps.map((row, index) => {
                  const isFastest =
                    bestLapMsFromLaps != null &&
                    row.timeMs === bestLapMsFromLaps;
                  const deltaContent =
                    bestLapMsFromLaps == null
                      ? "—"
                      : row.timeMs === bestLapMsFromLaps
                        ? "🏁 BEST"
                        : formatDeltaMs(row.timeMs - bestLapMsFromLaps);
                  return (
                    <tr
                      key={`lap-${row.lap}-${index}`}
                      className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                      style={
                        isFastest
                          ? { backgroundColor: "rgba(240, 28, 28, 0.08)" }
                          : undefined
                      }
                    >
                      <td className="py-3 px-4 font-medium text-white">
                        {row.lap}
                        {isFastest && " 🏁"}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono text-sm ${
                          row.sector1Ms === bestS1 && Number.isFinite(bestS1)
                            ? "text-purple-400"
                            : "text-white/80"
                        }`}
                      >
                        {formatLapMs(row.sector1Ms)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono text-sm ${
                          row.sector2Ms === bestS2 && Number.isFinite(bestS2)
                            ? "text-purple-400"
                            : "text-white/80"
                        }`}
                      >
                        {formatLapMs(row.sector2Ms)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono text-sm ${
                          row.sector3Ms === bestS3 && Number.isFinite(bestS3)
                            ? "text-purple-400"
                            : "text-white/80"
                        }`}
                      >
                        {formatLapMs(row.sector3Ms)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={lapColorClass(row.timeMs)}>
                          {formatLapMs(row.timeMs)}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right ${
                          row.timeMs === bestLapMsFromLaps
                            ? "text-sm font-medium text-white"
                            : "text-sm text-white/60"
                        }`}
                      >
                        {deltaContent}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {canShowMoreLaps && (
              <div className="px-4 py-3 border-t border-white/10 flex justify-end bg-white/[0.02]">
                <button
                  type="button"
                  className="text-xs font-medium text-white/70 hover:text-white"
                  onClick={() => setShowAllLaps(true)}
                >
                  See all laps
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-wider text-white/50">
              Consistency Score
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-4xl font-semibold text-white">
                {consistency == null ? "—" : consistency}
                {consistency != null && (
                  <span className="text-base text-white/50">/100</span>
                )}
              </div>
              <div className="text-sm text-white/60">
                {consistency == null
                  ? "Complete 3+ laps to score"
                  : consistency >= 90
                    ? "Elite consistency"
                    : consistency >= 75
                      ? "Solid consistency"
                      : "Needs consistency"}
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/40"
                style={{ width: `${consistency ?? 0}%` }}
              />
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-white">
              Analysis & Highlights
            </h3>
            <div className="mt-4 space-y-4">
              {insights.map((i, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="text-lg">{i.icon}</div>
                  <div>
                    <div className="font-medium text-white">{i.title}</div>
                    <div className="text-sm text-white/60">{i.description}</div>
                  </div>
                </div>
              ))}
            </div>
            {session.compareToPrevious && (
              <div className="mt-6 border-t border-white/5 pt-4">
                <div className="text-xs text-neutral-400 tracking-wide">
                  COMPARED TO PREVIOUS SESSION
                </div>
                <div className="mt-2 space-y-1 text-sm text-neutral-300">
                  {session.compareToPrevious.bestLapDiffMs != null && (
                    <div>
                      Best lap{" "}
                      {session.compareToPrevious.bestLapDiffMs < 0
                        ? "improved"
                        : "was slower"}{" "}
                      by{" "}
                      {formatLapDelta(
                        Math.abs(session.compareToPrevious.bestLapDiffMs)
                      )}
                    </div>
                  )}
                  {session.compareToPrevious.medianLapDiffMs != null && (
                    <div>
                      Median pace{" "}
                      {session.compareToPrevious.medianLapDiffMs < 0
                        ? "improved"
                        : "was slower"}{" "}
                      by{" "}
                      {formatLapDelta(
                        Math.abs(session.compareToPrevious.medianLapDiffMs)
                      )}
                    </div>
                  )}
                  {session.compareToPrevious.consistencyDiffPct != null && (
                    <div>
                      Consistency{" "}
                      {session.compareToPrevious.consistencyDiffPct > 0
                        ? "improved"
                        : "decreased"}{" "}
                      by{" "}
                      {Math.abs(
                        session.compareToPrevious.consistencyDiffPct
                      ).toFixed(1)}
                      %
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete this manual activity?"
        message="This cannot be undone."
      />
    </div>
  );
}
