import { Link, useParams, useNavigate } from "react-router-dom";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Share2, PenLine, Pencil, Trash2, Repeat, Timer, Flag } from "lucide-react";
import { apiGet, deleteManualActivity, ApiError } from "@/lib/api";
import { formatLapMs, formatLapDelta, formatCarName } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import { formatSessionTypeUpper } from "@/lib/sim";
import { formatActivitySource } from "@/lib/enumFormat";
import SimBadge from "@/components/SimBadge";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import PageMeta from "@/components/PageMeta";
import SessionShareModal from "@/components/SessionShareModal";
import { Button } from "@/components/ui/button";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  buildSessionShareText,
  calcConsistencyScore,
  resolveSessionFields,
  sanitizeLapTimesForConsistency,
} from "@/lib/sessionShareText";
import { invalidateSessionDerivedCaches } from "@/lib/profileQueryKeys";
import { formatLapDeltaMsForDisplay } from "@/features/session-detail/sessionInsights";
import {
  parseApexAnalysisDisplay,
  type ApexAnalysisPayload,
} from "@/features/session-detail/apexAnalysisDisplay";
import { Sparkles } from "lucide-react";

type RawLap = {
  lap: number;
  lapNumber?: number;
  timeMs?: number;
  lapTimeMs?: number;
  isValid?: boolean;
  isBestLap?: boolean;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
};

type NormalizedLap = {
  lap: number;
  timeMs: number;
  isValid?: boolean;
  isBestLap?: boolean;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
};

function normalizeLaps(laps: RawLap[] | undefined): NormalizedLap[] {
  if (!laps) return [];
  return laps.map((l) => ({
    lap: l.lapNumber ?? l.lap,
    timeMs: l.lapTimeMs ?? l.timeMs ?? 0,
    isValid: l.isValid,
    isBestLap: l.isBestLap,
    sector1Ms: l.sector1Ms,
    sector2Ms: l.sector2Ms,
    sector3Ms: l.sector3Ms,
  }));
}

type BackendLapLite = {
  lapNumber: number;
  lapTimeMs: number;
  isValid: boolean;
  isBestLap: boolean;
};

type TelemetryPayload = {
  distance: number[];
  speed: number[];
  brake: number[];
  throttle: number[];
  gear: number[];
};

type SessionDetailResponse =
  | SessionDetail
  | {
      session: SessionDetail;
      laps?: BackendLapLite[];
      defaultTelemetryLapNumber?: number;
      telemetry?: TelemetryPayload | null;
      trackName?: string | null;
      carName?: string | null;
      game?: string | null;
      sim?: string | null;
      proFeaturesLocked?: boolean;
    };

function parseSessionDetailApiResponse(data: SessionDetailResponse): {
  session: SessionDetail;
  lapsData: BackendLapLite[] | null;
  defaultTelemetryLapNumber: number | null;
  telemetry: TelemetryPayload | null;
  proFeaturesLocked: boolean;
  apexAnalysis: ApexAnalysisPayload;
} {
  if (data && typeof data === "object" && "session" in (data as object)) {
    const d = data as Exclude<SessionDetailResponse, SessionDetail>;
    const base =
      (d.session as any)?.session && typeof (d.session as any).session === "object"
        ? ((d.session as any).session as SessionDetail)
        : d.session;
    const outer = d.session as any;
    const mergedSession: SessionDetail = {
      ...(outer && typeof outer === "object" ? outer : {}),
      ...(base && typeof base === "object" ? base : {}),
      trackName: (base as any)?.trackName ?? (outer as any)?.trackName ?? (d as any).trackName ?? null,
      carName: (base as any)?.carName ?? (outer as any)?.carName ?? (d as any).carName ?? null,
      game: (base as any)?.game ?? (outer as any)?.game ?? (d as any).game ?? null,
      sim: (base as any)?.sim ?? (outer as any)?.sim ?? (d as any).sim ?? null,
    };
    const lapsPayload =
      (Array.isArray(d.laps) ? d.laps : null) ??
      (Array.isArray((d as any).laps) ? ((d as any).laps as unknown[]) : null) ??
      (Array.isArray((outer as any)?.laps) ? ((outer as any).laps as unknown[]) : null) ??
      (Array.isArray((base as any)?.laps) ? ((base as any).laps as unknown[]) : null);

    const lite =
      Array.isArray(lapsPayload) &&
      lapsPayload.length > 0 &&
      typeof (lapsPayload[0] as any)?.lapNumber === "number" &&
      typeof (lapsPayload[0] as any)?.lapTimeMs === "number"
        ? (lapsPayload as BackendLapLite[])
        : null;

    const apexRaw =
      (d as { apexAnalysis?: ApexAnalysisPayload }).apexAnalysis ??
      (mergedSession as { apexAnalysis?: ApexAnalysisPayload }).apexAnalysis ??
      [];
    return {
      session: mergedSession,
      lapsData: lite,
      defaultTelemetryLapNumber: d.defaultTelemetryLapNumber ?? null,
      telemetry: d.telemetry ?? null,
      proFeaturesLocked: Boolean((d as { proFeaturesLocked?: boolean }).proFeaturesLocked),
      apexAnalysis: apexRaw ?? [],
    };
  }

  const flat = data as SessionDetail & {
    proFeaturesLocked?: boolean;
    apexAnalysis?: ApexAnalysisPayload;
  };
  return {
    session: flat,
    lapsData: null,
    defaultTelemetryLapNumber: null,
    telemetry: null,
    proFeaturesLocked: Boolean(flat.proFeaturesLocked),
    apexAnalysis: flat.apexAnalysis ?? [],
  };
}

function pickBestLapNumber(
  laps: NormalizedLap[],
  serverDefault?: number
): number | null {
  if (serverDefault != null && Number.isFinite(serverDefault) && serverDefault > 0) {
    return serverDefault;
  }
  const marked = laps.find((l) => l.isBestLap);
  if (marked?.lap != null && marked.lap > 0) return marked.lap;
  if (laps.length === 0) return null;
  const valid = laps.filter((l) => l.isValid !== false && l.timeMs > 0);
  const pool = valid.length > 0 ? valid : laps.filter((l) => l.timeMs > 0);
  if (pool.length === 0) return null;
  const best = pool.reduce((acc, cur) => (cur.timeMs < acc.timeMs ? cur : acc), pool[0]);
  return best.lap ?? null;
}

function buildPolyline(
  xs: number[],
  ys: number[],
  width: number,
  height: number
): string {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return "";
  const xMin = Math.min(...xs.slice(0, n));
  const xMax = Math.max(...xs.slice(0, n));
  const yMin = Math.min(...ys.slice(0, n));
  const yMax = Math.max(...ys.slice(0, n));
  const xDen = xMax - xMin || 1;
  const yDen = yMax - yMin || 1;
  const points: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = ((xs[i] - xMin) / xDen) * width;
    const y = height - ((ys[i] - yMin) / yDen) * height;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

function TelemetryTracesCard({
  telemetry,
  lapNumber,
}: {
  telemetry: TelemetryPayload;
  lapNumber: number | null;
}) {
  const width = 920;
  const height = 220;
  const xs = telemetry.distance ?? [];
  const speed = telemetry.speed ?? [];
  const brake = telemetry.brake ?? [];
  const throttle = telemetry.throttle ?? [];
  const gear = telemetry.gear ?? [];

  const n = Math.min(xs.length, speed.length, brake.length, throttle.length, gear.length);
  const xSlice = xs.slice(0, n);
  const speedSlice = speed.slice(0, n);
  const brakeSlice = brake.slice(0, n);
  const throttleSlice = throttle.slice(0, n);
  const gearSlice = gear.slice(0, n);

  const speedPoints = buildPolyline(xSlice, speedSlice, width, height);
  const throttlePoints = buildPolyline(xSlice, throttleSlice, width, height);
  const brakePoints = buildPolyline(xSlice, brakeSlice, width, height);
  const gearPoints = buildPolyline(xSlice, gearSlice, width, height);

  return (
    <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">
            Telemetry Analysis
          </div>
          <div className="mt-1 text-sm text-white/70">
            {lapNumber != null ? `Best lap telemetry (Lap ${lapNumber})` : "Best lap telemetry"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-sky-400" /> Speed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-400" /> Throttle
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-400" /> Brake
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-violet-400" /> Gear
          </span>
        </div>
      </div>

      {n < 2 || !speedPoints ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/60">Telemetry unavailable for this session.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="block h-[220px] w-full"
            preserveAspectRatio="none"
            aria-label="Telemetry traces"
          >
            <polyline points={speedPoints} fill="none" stroke="rgba(56,189,248,0.95)" strokeWidth="2" />
            <polyline points={throttlePoints} fill="none" stroke="rgba(52,211,153,0.9)" strokeWidth="2" />
            <polyline points={brakePoints} fill="none" stroke="rgba(251,191,36,0.9)" strokeWidth="2" />
            <polyline points={gearPoints} fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="2" />
          </svg>
        </div>
      )}
    </div>
  );
}

export type SessionSource = "TELEMETRY" | "MANUAL_ACTIVITY" | "AGENT" | string;

export type SessionDetail = {
  id: string;
  sessionType?: "PRACTICE" | "RACE" | "QUALIFY" | "UNKNOWN" | null;
  sim?: string | null;
  game?: string | null;
  track: string | null;
  trackName?: string | null;
  trackId?: string | null;
  car: string | null;
  carName?: string | null;
  carId?: string | null;
  vehicleDisplay?: string;
  position?: number | null;
  totalDrivers?: number | null;
  bestLapMs?: number | null;
  bestLapLapNumber?: number | null;
  lapCount?: number | null;
  /** Distance (km): track length × laps, or telemetry fallback. */
  totalKm?: number | null;
  laps?: RawLap[];
  /** Server-computed from valid lap times (same as activity feed). */
  consistencyScore?: number | null;
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
  /** Manual rows only: PRACTICE | QUALIFY | RACE */
  manualSessionKind?: string | null;
};

/** Same rule as GET /api/leaderboards?metric=fastestLap (see server sessionKind). */
function sessionEligibleForGlobalFastestLapLeaderboard(s: SessionDetail): boolean {
  const st = (s.sessionType ?? "").toUpperCase().trim();
  if (st === "MANUAL_ACTIVITY") {
    return (s.manualSessionKind ?? "").toUpperCase().trim() === "RACE";
  }
  return st === "RACE" || st === "SPRINT";
}

function primaryActivityLabel(session: SessionDetail): string {
  const st = (session.sessionType ?? "").toUpperCase().trim();
  if (st === "MANUAL_ACTIVITY") {
    const mk = (session.manualSessionKind ?? "").toUpperCase().trim();
    if (mk === "RACE") return "Manual · Race";
    if (mk === "QUALIFY") return "Manual · Qualifying";
    if (mk === "PRACTICE") return "Manual · Practice";
    return "Manual";
  }
  const src = (session.source ?? "").toString().toUpperCase();
  if (src === "AGENT" || st === "AGENT") return formatActivitySource("AGENT");
  if (src === "TELEMETRY" || st === "TELEMETRY") {
    return formatActivitySource("TELEMETRY");
  }
  return formatSessionTypeUpper(session.sessionType);
}

function isManualActivity(session: SessionDetail): boolean {
  const st = (session.sessionType ?? "").toUpperCase();
  if (st === "MANUAL_ACTIVITY") return true;
  const src = (session.source ?? "").toString().toUpperCase();
  if (src === "MANUAL" || src === "MANUAL_ACTIVITY") return true;
  if (src === "TELEMETRY" || src === "AGENT") return false;
  const hasNoLaps = !session.laps || session.laps.length === 0;
  const hasNoTelemetryFields =
    session.lapCount === 0 ||
    session.lapCount == null ||
    session.bestLapLapNumber == null;
  return hasNoLaps && hasNoTelemetryFields;
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPro = useIsProUser();
  const [showAllLaps, setShowAllLaps] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: sessionPayload,
    isPending: loading,
    error: queryError,
    isError,
  } = useQuery({
    queryKey: ["sessions", "detail", id ?? ""],
    queryFn: async () => {
      const raw = await apiGet<SessionDetailResponse>(`/api/sessions/${id!}`);
      return parseSessionDetailApiResponse(raw);
    },
    enabled: Boolean(id),
  });

  const session = sessionPayload?.session ?? null;
  const lapsData = sessionPayload?.lapsData ?? null;

  const shareUrl = useMemo(() => {
    if (!id || typeof window === "undefined") return "";
    return `${window.location.origin}/sessions/${id}`;
  }, [id]);
  const defaultTelemetryLapNumber = sessionPayload?.defaultTelemetryLapNumber ?? null;
  const telemetry = sessionPayload?.telemetry ?? null;
  const proFeaturesLocked = sessionPayload?.proFeaturesLocked === true;
  const apexAnalysis = sessionPayload?.apexAnalysis ?? [];

  const sessionDetailDeniedMessage = (() => {
    if (!isError || !(queryError instanceof ApiError)) return null;
    if (queryError.status !== 403) return null;
    switch (queryError.code) {
      case "SESSION_HISTORY_LOCKED":
        return "This session is outside the free plan history window. Upgrade to Apex Pro for unlimited session access.";
      case "SESSION_VISIBILITY_PRIVATE":
        return "This session is private. Only the driver can view it.";
      case "SESSION_VISIBILITY_FOLLOWERS_ONLY":
        return "This session is limited to the driver's followers. Sign in and follow them to view it, or ask the driver to change session visibility in settings.";
      default:
        return queryError.message || "You don’t have access to this session.";
    }
  })();

  const error = isError
    ? sessionDetailDeniedMessage ??
      (queryError instanceof Error ? queryError.message : "Failed to load session")
    : null;

  if (!id) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Missing session ID.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SkeletonBlock height={12} width={72} />
              <SkeletonBlock height={24} width={64} rounded="lg" />
            </div>
            <SkeletonBlock height={32} width={280} className="mt-1" rounded="lg" />
          </div>
          <div className="flex shrink-0 gap-2">
            <SkeletonBlock height={40} width={88} rounded="lg" />
            <SkeletonBlock height={40} width={72} rounded="lg" />
          </div>
        </div>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          className="mb-8 w-full rounded-lg border border-white/10"
        />
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonBlock height={200} className="rounded-lg border border-white/10" />
          <SkeletonBlock height={200} className="rounded-lg border border-white/10" />
        </div>
      </div>
    );
  }
  if (error || !session) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          {error ?? `Session detail coming soon: ${id}`}
        </p>
      </div>
    );
  }

  const sessionTypeLabel = primaryActivityLabel(session);
  const resolved = resolveSessionFields(session);
  const laps = normalizeLaps(
    (lapsData
      ? lapsData.map((l) => ({
          lapNumber: l.lapNumber,
          lapTimeMs: l.lapTimeMs,
          isValid: l.isValid,
          isBestLap: l.isBestLap,
          lap: l.lapNumber,
        }))
      : session.laps) as RawLap[] | undefined
  )
    .filter((l) => Number.isFinite(l.lap) && l.lap > 0)
    .sort((a, b) => a.lap - b.lap);
  const totalLapsCount =
    typeof session.lapCount === "number" && session.lapCount > 0
      ? session.lapCount
      : laps.length;
  const hasNoLaps = totalLapsCount === 0;
  const isManual = isManualActivity(session);
  const isOwner = user?.id != null && session.userId === user.id;
  const canEditSession = isOwner;
  const canManualExtras = isManual && isOwner;
  const stUp = (session.sessionType ?? "").toUpperCase();
  const mkUp = (session.manualSessionKind ?? "").toUpperCase();
  const hasRaceLikeFinish =
    stUp === "RACE" ||
    stUp === "QUALIFY" ||
    stUp === "SPRINT" ||
    (stUp === "MANUAL_ACTIVITY" && (mkUp === "RACE" || mkUp === "QUALIFY"));
  const showPosition = hasRaceLikeFinish && session.position != null;
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

  const apexAnalysisDisplay = parseApexAnalysisDisplay(apexAnalysis);
  const apexInsightsLocked = apexAnalysisDisplay.locked;
  const apexInsightLines = apexAnalysisDisplay.insights;
  const visibleLaps = showAllLaps ? laps : laps.slice(0, 6);
  const canShowMoreLaps = !showAllLaps && laps.length > 6;
  const lapTimes = sanitizeLapTimesForConsistency(laps.map((l) => l.timeMs));
  const consistency =
    session.consistencyScore != null && Number.isFinite(session.consistencyScore)
      ? Math.round(session.consistencyScore)
      : calcConsistencyScore(lapTimes);
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
  const bestLapNumberForTelemetry = pickBestLapNumber(laps, defaultTelemetryLapNumber ?? undefined);
  const hasTelemetry =
    telemetry != null &&
    Array.isArray(telemetry.distance) &&
    telemetry.distance.length > 1 &&
    Array.isArray(telemetry.speed) &&
    telemetry.speed.length > 1;

  const sessionShareText = buildSessionShareText(session);
  const sessionShareTitle =
    sessionShareText.split("\n")[0]?.trim() || "Apex session";

  async function handleDelete() {
    if (!id) return;

    try {
      await deleteManualActivity(id);
      invalidateSessionDerivedCaches(queryClient, {
        sessionId: id,
        ownerUserId: session.userId ?? user?.id ?? null,
        removeSessionQueries: true,
      });
      toast.success("Activity deleted", {
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
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageMeta
        title={sessionShareTitle}
        description={sessionShareText}
        path={`/sessions/${id}`}
      />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wider text-[rgb(240,28,28)]">
              {sessionTypeLabel}
            </p>
            <SimBadge sim={resolved.sim ?? session.sim} />
            {isManual && (
              <span className="inline-flex items-center gap-1 rounded border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-violet-300">
                <PenLine className="size-3" />
                Manual
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            {formatTrackName(resolved.track)}
          </h1>
          {import.meta.env.DEV && session.processingDurationMs != null && (
            <p className="mt-1 text-xs text-white/40">
              Ingestion: {(session.processingDurationMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canManualExtras && (
            <>
              <button
                type="button"
                onClick={() =>
                  navigate("/manual", {
                    state: {
                      logAgain: {
                        sim: (resolved.sim ?? session.sim) ?? undefined,
                        trackId: session.trackId ?? undefined,
                        carId: session.carId ?? undefined,
                      },
                    },
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <Repeat className="size-4" />
                Log Again
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            </>
          )}
          {canEditSession && id && (
            <button
              type="button"
              onClick={() => navigate(`/sessions/${id}/edit`)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Pencil className="size-4" />
              Edit
            </button>
          )}
          {session != null && id && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
              onClick={() => setShareModalOpen(true)}
            >
              Share
              <Share2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div
        className={`mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 ${
          showPosition ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        {showPosition && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-white/50">
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
        <div
          className={`rounded-lg border border-white/10 bg-white/[0.03] p-4 ${
            !hasNoLaps ? "sm:col-span-2 lg:col-span-1" : ""
          }`}
        >
          <p className="mb-1 text-xs uppercase tracking-wider text-white/50">
            Best Lap
          </p>
          <p className="text-lg font-semibold text-white">
            {formatLapMs(session.bestLapMs)}
          </p>
          {!hasNoLaps && (
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              {sessionEligibleForGlobalFastestLapLeaderboard(session) ? (
                <>
                  The{" "}
                  <Link to="/leaderboards" className="text-white/55 underline underline-offset-2 hover:text-white/80">
                    fastest lap
                  </Link>{" "}
                  board lists the top ten drivers across the platform. Your session can still have the best lap shown
                  here without appearing on that list.
                </>
              ) : (
                <>
                  The{" "}
                  <Link to="/leaderboards" className="text-white/55 underline underline-offset-2 hover:text-white/80">
                    fastest lap
                  </Link>{" "}
                  leaderboard uses race laps only (telemetry race/sprint, or manual activity with session kind Race).
                  Practice and qualifying laps are ignored there—this session&apos;s badge above shows how it was
                  logged.
                </>
              )}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-1 text-xs uppercase tracking-wider text-white/50">
            Total Laps
          </p>
          <p className="text-lg font-semibold text-white">
            {totalLapsCount}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-1 text-xs uppercase tracking-wider text-white/50">
            Car
          </p>
          <p className="text-lg font-semibold text-white">
            {formatCarName(resolved.car ?? resolved.carRawForFormat ?? null)}
          </p>
        </div>
      </div>

      <>
        {!hasNoLaps && bestLapLapNumber != null && (
          <div className="mb-2 mt-8 text-sm text-white/60">
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
          {proFeaturesLocked ? (
            <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wider text-white/50">Ideal Lap</span>
                <Link
                  to="/pricing"
                  className="text-xs font-medium text-amber-400 hover:text-amber-300"
                >
                  Unlock with Pro
                </Link>
              </div>
              <p className="mt-2 text-sm text-white/60">
                Sector breakdown and ideal lap times are included with Apex Pro.
              </p>
            </div>
          ) : (
          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-white/50">Ideal Lap</span>
            </div>
            <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-4">
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  S1
                </div>
                <div className="mt-0.5 font-mono text-base font-semibold text-purple-400">
                  {bestS1Insights != null && Number.isFinite(bestS1Insights)
                    ? formatLapMs(bestS1Insights)
                    : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  S2
                </div>
                <div className="mt-0.5 font-mono text-base font-semibold text-purple-400">
                  {bestS2Insights != null && Number.isFinite(bestS2Insights)
                    ? formatLapMs(bestS2Insights)
                    : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  S3
                </div>
                <div className="mt-0.5 font-mono text-base font-semibold text-purple-400">
                  {bestS3Insights != null && Number.isFinite(bestS3Insights)
                    ? formatLapMs(bestS3Insights)
                    : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Time
                </div>
                <div className="mt-0.5 font-mono text-base font-semibold text-purple-400">
                  {formatLapMs(idealLapMs)}
                </div>
              </div>
            </div>
          </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03]">
            <table className="w-full min-w-[32rem]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white/60 sm:px-4 sm:py-3">
                    Lap
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-white/60 sm:px-4 sm:py-3">
                    S1
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-white/60 sm:px-4 sm:py-3">
                    S2
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-white/60 sm:px-4 sm:py-3">
                    S3
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-white/60 sm:px-4 sm:py-3">
                    Time
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-white/60 sm:px-4 sm:py-3">
                    DELTA
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleLaps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                          <Timer className="size-5 text-white/45" />
                        </div>
                        <div className="text-sm text-white/60">
                          No laps recorded yet. Add your first lap to get started.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleLaps.map((row, index) => {
                  const isFastest =
                    bestLapMsFromLaps != null &&
                    row.timeMs === bestLapMsFromLaps;
                  const deltaContent: ReactNode =
                    bestLapMsFromLaps == null
                      ? "—"
                      : row.timeMs === bestLapMsFromLaps
                        ? (
                            <span className="inline-flex items-center gap-1">
                              <Flag className="size-3.5 shrink-0" aria-hidden />
                              BEST
                            </span>
                          )
                        : formatLapDeltaMsForDisplay(row.timeMs - bestLapMsFromLaps);
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
                      <td className="px-2 py-2 font-medium text-white sm:px-4 sm:py-3">
                        <span className="inline-flex items-center gap-1.5">
                          {row.lap}
                          {isFastest && (
                            <Flag className="size-4 shrink-0 text-white/90" aria-hidden />
                          )}
                        </span>
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-mono text-sm sm:px-4 sm:py-3 ${
                          proFeaturesLocked
                            ? "select-none blur-sm text-white/40"
                            : row.sector1Ms === bestS1 && Number.isFinite(bestS1)
                              ? "text-purple-400"
                              : "text-white/80"
                        }`}
                      >
                        {proFeaturesLocked ? "—" : formatLapMs(row.sector1Ms)}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-mono text-sm sm:px-4 sm:py-3 ${
                          proFeaturesLocked
                            ? "select-none blur-sm text-white/40"
                            : row.sector2Ms === bestS2 && Number.isFinite(bestS2)
                              ? "text-purple-400"
                              : "text-white/80"
                        }`}
                      >
                        {proFeaturesLocked ? "—" : formatLapMs(row.sector2Ms)}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-mono text-sm sm:px-4 sm:py-3 ${
                          proFeaturesLocked
                            ? "select-none blur-sm text-white/40"
                            : row.sector3Ms === bestS3 && Number.isFinite(bestS3)
                              ? "text-purple-400"
                              : "text-white/80"
                        }`}
                      >
                        {proFeaturesLocked ? "—" : formatLapMs(row.sector3Ms)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono sm:px-4 sm:py-3">
                        <span className={lapColorClass(row.timeMs)}>
                          {formatLapMs(row.timeMs)}
                        </span>
                      </td>
                      <td
                        className={`px-2 py-2 text-right sm:px-4 sm:py-3 ${
                          row.timeMs === bestLapMsFromLaps
                            ? "text-sm font-medium text-white"
                            : "text-sm text-white/60"
                        }`}
                      >
                        {deltaContent}
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
            {canShowMoreLaps && (
              <div className="flex justify-end border-t border-white/10 bg-white/[0.02] px-4 py-3">
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

          {/* Telemetry (Best lap only) — small add-on below existing laps content */}
          {isPro ? (
            hasTelemetry ? (
              <TelemetryTracesCard
                telemetry={telemetry as TelemetryPayload}
                lapNumber={bestLapNumberForTelemetry}
              />
            ) : (
              <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6 text-center">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Telemetry Analysis
                </div>
                <p className="mt-2 text-sm text-white/60">
                  No telemetry available for this session
                </p>
              </div>
            )
          ) : (
            <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center">
              {/* Subtle preview background */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
                <svg
                  className="absolute inset-0 size-full"
                  viewBox="0 0 1000 260"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points="0,200 120,160 220,170 320,120 420,140 520,90 620,110 740,70 860,85 1000,60"
                    fill="none"
                    stroke="rgba(56,189,248,0.22)"
                    strokeWidth="3"
                  />
                  <polyline
                    points="0,220 120,210 220,180 320,190 420,150 520,160 620,120 740,140 860,110 1000,130"
                    fill="none"
                    stroke="rgba(52,211,153,0.18)"
                    strokeWidth="3"
                  />
                  <polyline
                    points="0,240 140,230 260,235 380,210 500,220 620,195 740,205 860,175 1000,185"
                    fill="none"
                    stroke="rgba(251,191,36,0.16)"
                    strokeWidth="3"
                  />
                  {/* soft grid */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line
                      key={`tg-h-${i}`}
                      x1="0"
                      x2="1000"
                      y1={String(40 + i * 36)}
                      y2={String(40 + i * 36)}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              </div>

              <div className="relative">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Telemetry Analysis
                </div>
                <p className="mt-2 text-lg font-semibold text-white">
                  Telemetry Analysis is available with Apex Pro
                </p>
                <p className="mt-1 text-sm text-white/60">
                  Unlock speed, brake, throttle and gear data for your best lap
                </p>
                <Button
                  asChild
                  className="mt-5 bg-amber-500 text-black hover:bg-amber-400"
                >
                  <Link to="/pricing">Upgrade to Pro</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-wider text-white/50">
              Consistency Score
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
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
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/40"
                style={{ width: `${consistency ?? 0}%` }}
              />
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold text-white">
              Apex Analysis
            </h3>
            {apexInsightsLocked ? (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wider text-white/50">
                    Coaching insights
                  </span>
                  <Link
                    to="/pricing"
                    className="text-xs font-medium text-amber-400 hover:text-amber-300"
                  >
                    Unlock with Pro
                  </Link>
                </div>
                <p className="mt-2 text-sm text-white/60">
                  {apexAnalysisDisplay.message ??
                    "Unlock Apex Analysis with Apex Pro"}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {apexInsightLines.length === 0 ? (
                  <p className="text-sm text-white/50">
                    No coaching insights for this session yet. Upload telemetry with lap
                    data to generate analysis.
                  </p>
                ) : (
                  apexInsightLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <Sparkles
                        className="mt-0.5 size-5 shrink-0 text-amber-400/80"
                        aria-hidden
                      />
                      <p className="text-sm text-white/80">{line}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            {session.compareToPrevious && (
              <div className="mt-6 border-t border-white/5 pt-4">
                <div className="text-xs tracking-wide text-neutral-400">
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

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete this manual activity?"
        message="This cannot be undone."
      />

      <SessionShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        shareText={sessionShareText}
      />
    </div>
  );
}
