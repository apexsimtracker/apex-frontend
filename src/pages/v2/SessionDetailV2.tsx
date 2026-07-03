import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { formatLapMs, formatCarName } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { buildPageTitle } from "@/lib/seo";
import {
  buildHighlightMapFromLaps,
  EMPTY_SESSION_TIMING_MINIMA,
  type LapTimingHighlights,
} from "@/lib/sessionLapDisplay";
import {
  buildSessionShareText,
  calcConsistencyScore,
  resolveSessionFields,
  sanitizeLapTimesForConsistency,
} from "@/lib/sessionShareText";
import { parseApexAnalysisDisplay } from "@/features/session-detail/apexAnalysisDisplay";
import {
  fetchSessionDetail,
  normalizeLaps,
  sessionDetailDeniedMessage,
  type NormalizedLap,
  type RawLap,
} from "@/features/session-detail/sessionDetailData";
import PageMeta from "@/components/PageMeta";
import SessionLapTableV2 from "./session/SessionLapTableV2";
import SessionTelemetryDemoV2 from "./session/SessionTelemetryDemoV2";

// NOTE(dummy): Loveable reference visuals. Used as fallbacks so every section
// renders even when the backend/agent does not provide the data yet. Replace
// with real fields once available. Source: loveable-ui/public/screens/activity-detail.html
const DUMMY_TRACK_IMAGE = "/screens/img/oulton-park.svg";
const DUMMY_BEST_LAP = "1:08.635";
const DUMMY_LAP_COUNT = "5";
const DUMMY_CAR = "Red Bull RB20";
const DUMMY_SECTORS_MS = { s1: 19781, s2: 24067, s3: 24612 };
const DUMMY_IDEAL_LAP_MS = 68460;
const DUMMY_APEX_TEXT =
  "Your consistency through Raidillon is top-tier. Keep entry speed >240km/h for optimal exit onto Kemmel.";

// NOTE(dummy): Static lap rows + highlight map mirroring the Loveable table so
// the section renders when a session has no lap data.
const DUMMY_LAPS: NormalizedLap[] = [
  {
    lap: 1,
    timeMs: 68861,
    sector1Ms: 19847,
    sector2Ms: 24123,
    sector3Ms: 24891,
  },
  {
    lap: 2,
    timeMs: 68755,
    sector1Ms: 19923,
    sector2Ms: 24089,
    sector3Ms: 24743,
  },
  {
    lap: 3,
    timeMs: 69147,
    sector1Ms: 20012,
    sector2Ms: 24201,
    sector3Ms: 24934,
  },
  {
    lap: 4,
    timeMs: 68871,
    sector1Ms: 19781,
    sector2Ms: 24334,
    sector3Ms: 24756,
  },
  {
    lap: 5,
    timeMs: 68635,
    sector1Ms: 19956,
    sector2Ms: 24067,
    sector3Ms: 24612,
  },
];
const DUMMY_LAP_HIGHLIGHTS = new Map<number, LapTimingHighlights>([
  [4, { lap: "default", s1: "green", s2: "default", s3: "default" }],
  [5, { lap: "green", s1: "default", s2: "green", s3: "green" }],
]);
const DUMMY_BEST_LAP_MS = 68635;

const CARD = "rounded-lg bg-v2-surface-container-low p-4 shadow-lg";
const STAT_LABEL =
  "mb-1 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant";

export default function SessionDetailV2() {
  const { id } = useParams<{ id: string }>();
  const [showAllLaps, setShowAllLaps] = useState(false);

  const sid = id?.trim() ?? "";

  const {
    data: sessionPayload,
    isPending: loading,
    error: queryError,
    isError,
  } = useQuery({
    queryKey: ["sessions", "detail", sid],
    queryFn: () => fetchSessionDetail(sid),
    enabled: Boolean(sid),
  });

  const session = sessionPayload?.session ?? null;
  const apexAnalysis = sessionPayload?.apexAnalysis ?? null;

  const laps = useMemo<NormalizedLap[]>(() => {
    if (!session) return [];
    return normalizeLaps(session.laps as RawLap[] | undefined)
      .filter((l) => Number.isFinite(l.lap) && l.lap > 0)
      .sort((a, b) => a.lap - b.lap);
  }, [session]);

  const sessionMinima = useMemo(
    () => session?.sessionTimingMinima ?? EMPTY_SESSION_TIMING_MINIMA,
    [session?.sessionTimingMinima],
  );

  const realLapHighlights = useMemo(() => {
    if (laps.length === 0) return new Map<number, LapTimingHighlights>();
    return (
      buildHighlightMapFromLaps(laps) ??
      buildHighlightMapFromLaps(laps, { missingAsDefault: true }) ??
      new Map<number, LapTimingHighlights>()
    );
  }, [laps]);

  const detailPath = sid ? `/v2/sessions/${sid}` : "/v2/sessions";

  if (!sid) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-y-auto p-6">
        <p className="py-8 font-v2-body text-v2-on-surface-variant">
          Missing session ID.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <PageMeta
          title={buildPageTitle("Session")}
          description={`Loading session on ${COMPANY_NAME}.`}
          path={detailPath}
          noindex
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="font-v2-body text-v2-on-surface-variant">
            Loading session…
          </p>
        </div>
      </>
    );
  }

  const deniedMessage = sessionDetailDeniedMessage(queryError);
  const errorMessage = isError
    ? (deniedMessage ??
      (queryError instanceof Error
        ? queryError.message
        : "Failed to load session."))
    : null;

  if (errorMessage || !session) {
    return (
      <>
        <PageMeta
          title={buildPageTitle("Session")}
          description={errorMessage ?? "Session not found."}
          path={detailPath}
          noindex
        />
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-y-auto p-6">
          <Link
            to="/v2"
            className="mb-6 inline-flex items-center gap-2 font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back home
          </Link>
          <div className="rounded-lg bg-v2-surface-container-low p-6 font-v2-body text-sm text-v2-on-surface-variant shadow-lg">
            {errorMessage ?? "Session not found."}
          </div>
        </div>
      </>
    );
  }

  const resolved = resolveSessionFields(session);

  // Real data with Loveable dummy fallbacks so every section renders.
  const trackTitle = formatTrackName(resolved.track) || "Albert Park";
  const bestLapText =
    session.bestLapMs != null ? formatLapMs(session.bestLapMs) : DUMMY_BEST_LAP;
  const carText =
    formatCarName(resolved.car ?? resolved.carRawForFormat ?? null) ||
    DUMMY_CAR;
  const totalLapsCount =
    typeof session.lapCount === "number" && session.lapCount > 0
      ? session.lapCount
      : laps.length;
  const lapCountText =
    totalLapsCount > 0 ? String(totalLapsCount) : DUMMY_LAP_COUNT;

  // Sector breakdown: real minima, else dummy. NOTE(dummy): gap-to-best is static.
  const sectorS1 = sessionMinima.s1Ms ?? DUMMY_SECTORS_MS.s1;
  const sectorS2 = sessionMinima.s2Ms ?? DUMMY_SECTORS_MS.s2;
  const sectorS3 = sessionMinima.s3Ms ?? DUMMY_SECTORS_MS.s3;
  const idealLapMs =
    sessionMinima.s1Ms != null &&
    sessionMinima.s2Ms != null &&
    sessionMinima.s3Ms != null
      ? sessionMinima.s1Ms + sessionMinima.s2Ms + sessionMinima.s3Ms
      : (sessionMinima.lapMs ?? DUMMY_IDEAL_LAP_MS);

  // Lap history: real rows if present, else Loveable dummy rows.
  const hasRealLaps = laps.length > 0;
  const allLaps = hasRealLaps ? laps : DUMMY_LAPS;
  const lapHighlights = hasRealLaps ? realLapHighlights : DUMMY_LAP_HIGHLIGHTS;
  const bestLapMsFromLaps = hasRealLaps
    ? sessionMinima.lapMs
    : DUMMY_BEST_LAP_MS;
  const visibleLaps = showAllLaps ? allLaps : allLaps.slice(0, 6);
  const canShowMoreLaps = !showAllLaps && allLaps.length > 6;

  // Consistency: real score, else Loveable dummy.
  const lapTimes = sanitizeLapTimesForConsistency(allLaps.map((l) => l.timeMs));
  const realConsistency =
    session.consistencyScore != null &&
    Number.isFinite(session.consistencyScore)
      ? Math.round(session.consistencyScore)
      : calcConsistencyScore(lapTimes);
  const apexConsistencyText =
    realConsistency != null ? `${realConsistency}%` : "94.2%";
  const lapConsistencyText =
    realConsistency != null ? `${realConsistency}%` : "87%";

  // Apex coaching text: real first insight, else Loveable copy.
  const apexDisplay = parseApexAnalysisDisplay(apexAnalysis);
  const apexBody =
    !apexDisplay.locked && apexDisplay.insights.length > 0
      ? apexDisplay.insights[0]
      : DUMMY_APEX_TEXT;

  const sessionShareText = buildSessionShareText(session);
  const sessionShareTitle =
    sessionShareText.split("\n")[0]?.trim() || "Apex session";

  return (
    <div className="flex-1 overflow-y-auto bg-v2-background">
      <PageMeta
        title={sessionShareTitle}
        description={sessionShareText}
        path={detailPath}
      />

      {/* Hero header — NOTE(dummy): track art is a static Loveable asset. */}
      <header className="relative min-h-[256px] w-full overflow-hidden bg-black pb-12">
        <img
          alt={trackTitle}
          className="absolute inset-0 size-full object-contain"
          src={DUMMY_TRACK_IMAGE}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-v2-background via-v2-background/40 to-transparent" />
        {/* TODO(actions): re-add "+", Share and Edit actions here later. */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6">
          <Link
            to="/v2"
            className="flex items-center justify-center rounded-full p-2 text-white transition-colors hover:bg-white/10 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="size-6" aria-hidden />
          </Link>
          {/* TODO(comments): re-add a comments action that opens
                        SessionCommentsModalV2 (see src/pages/v2/session/SessionCommentsModalV2.tsx). */}
        </div>
        <div className="absolute bottom-6 left-6 z-10">
          <h1 className="font-v2-headline text-4xl font-bold tracking-tight text-white">
            {trackTitle}
          </h1>
        </div>
      </header>

      <main className="relative z-20 mx-auto -mt-4 w-full max-w-7xl space-y-4 px-6 pb-12">
        {/* Hero stats */}
        <section className={CARD}>
          <div className="flex items-start justify-between gap-4 overflow-x-auto">
            <div className="min-w-fit flex-1">
              <p className={STAT_LABEL}>Best lap</p>
              <h2 className="font-v2-headline text-xl font-bold leading-none text-[#FFD700] sm:text-2xl">
                {bestLapText}
              </h2>
            </div>
            <div className="h-8 w-px self-center bg-v2-outline-variant/20" />
            <div className="min-w-fit flex-1">
              <p className={STAT_LABEL}>Laps</p>
              <h2 className="font-v2-headline text-xl font-bold leading-none text-v2-on-surface sm:text-2xl">
                {lapCountText}
              </h2>
            </div>
            <div className="h-8 w-px self-center bg-v2-outline-variant/20" />
            <div className="min-w-fit flex-1">
              <p className={STAT_LABEL}>Car</p>
              <h2 className="whitespace-nowrap font-v2-headline text-sm font-bold leading-none text-v2-on-surface sm:text-lg">
                {carText}
              </h2>
            </div>
          </div>
        </section>

        {/* Sector breakdown — NOTE(dummy): gap-to-best is static; Pro gating
                    intentionally omitted for the demo. */}
        <section className={CARD}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
              Sector breakdown
            </h3>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-4">
            {(
              [
                ["Sector 1", sectorS1],
                ["Sector 2", sectorS2],
                ["Sector 3", sectorS3],
              ] as const
            ).map(([label, ms]) => (
              <div key={label} className="space-y-1.5">
                <div className="h-1 overflow-hidden rounded-full bg-v2-surface-container-highest">
                  <div className="size-full bg-green-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-v2-on-surface-variant">
                    {label}
                  </span>
                  <span className="font-v2-headline text-xl font-bold text-green-500">
                    {formatLapMs(ms)}
                  </span>
                  <span className="mt-1 text-[9px] font-medium uppercase text-v2-on-surface-variant/60">
                    Gap to best +0.00s
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-v2-outline-variant/10 pt-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#A855F7]" aria-hidden />
              <span className="mr-2 text-xs font-bold uppercase tracking-tight text-v2-on-surface-variant">
                Ideal lap time:
              </span>
              <span className="font-v2-headline text-lg font-bold text-[#A855F7]">
                {formatLapMs(idealLapMs)}
              </span>
            </div>
          </div>
        </section>

        {/* Lap history */}
        <section className="space-y-3">
          <h3 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
            Lap history
          </h3>
          <SessionLapTableV2
            laps={visibleLaps}
            lapHighlights={lapHighlights}
            bestLapMsFromLaps={bestLapMsFromLaps}
            canShowMore={canShowMoreLaps}
            onShowMore={() => setShowAllLaps(true)}
          />
        </section>

        {/* Two-column analysis */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Apex analysis — real coaching text if present, else dummy. */}
          <div className="rounded-lg border-l-4 border-v2-primary bg-v2-surface-container-low p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-5 text-v2-primary" aria-hidden />
              <h3 className="font-v2-headline text-xs font-bold uppercase tracking-widest text-v2-primary">
                Apex analysis
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-bold text-v2-on-surface">
                  Strong pace
                </p>
                <p className="text-[11px] leading-relaxed text-v2-on-surface-variant">
                  {apexBody}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded bg-v2-surface-container p-2.5">
                  <p className="mb-0.5 text-[9px] font-bold uppercase text-v2-on-surface-variant">
                    Consistency
                  </p>
                  <p className="font-v2-headline text-lg font-bold text-v2-on-surface">
                    {apexConsistencyText}
                  </p>
                </div>
                {/* NOTE(dummy): tire wear not provided by backend yet. */}
                <div className="rounded bg-v2-surface-container p-2.5">
                  <p className="mb-0.5 text-[9px] font-bold uppercase text-v2-on-surface-variant">
                    Tire wear
                  </p>
                  <p className="font-v2-headline text-lg font-bold text-v2-on-surface">
                    12%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry overview — NOTE(dummy): static values from Loveable. */}
          <div className={CARD}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
              Telemetry overview
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-v2-on-surface-variant">Top speed</span>
                <span className="font-bold text-v2-on-surface">338 km/h</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-v2-on-surface-variant">
                  Avg brake force
                </span>
                <span className="font-bold text-v2-on-surface">88%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-v2-on-surface-variant">
                  Time in 8th gear
                </span>
                <span className="font-bold text-v2-on-surface">14.2s</span>
              </div>
            </div>
          </div>
        </section>

        {/* Static telemetry graphs (pace, driver inputs, tyres, fuel). */}
        <SessionTelemetryDemoV2 />

        {/* Lap consistency — real score if present, dots/copy are dummy. */}
        <section className={CARD}>
          <h3 className="mb-3 font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
            Lap consistency
          </h3>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-v2-on-surface-variant">
                Consistency
              </span>
              {/* NOTE(dummy): per-lap consistency dots are static. */}
              <div className="flex gap-1">
                <span className="size-2.5 rounded-full bg-green-500" />
                <span className="size-2.5 rounded-full bg-green-500" />
                <span className="size-2.5 rounded-full bg-yellow-400" />
                <span className="size-2.5 rounded-full bg-green-500" />
                <span className="size-2.5 rounded-full bg-green-500" />
              </div>
            </div>
            <span className="font-v2-headline text-sm font-bold text-green-500">
              {lapConsistencyText}
            </span>
          </div>
          {/* NOTE(dummy): descriptive copy is static. */}
          <p className="text-[11px] text-v2-on-surface-variant/70">
            4 of 5 laps within 0.8s of your best. Strong session.
          </p>
        </section>
      </main>
    </div>
  );
}
