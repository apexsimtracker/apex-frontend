import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { deleteManualActivity, ApiError } from "@/lib/api";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { publicSessionUrl } from "@/lib/siteMeta";
import { buildPageTitle } from "@/lib/seo";
import {
  buildHighlightMapFromLaps,
  EMPTY_SESSION_TIMING_MINIMA,
} from "@/lib/sessionLapDisplay";
import {
  buildSessionShareText,
  calcConsistencyScore,
  resolveSessionFields,
  sanitizeLapTimesForConsistency,
} from "@/lib/sessionShareText";
import { formatLapDelta } from "@/lib/utils";
import { parseApexAnalysisDisplay } from "@/features/session-detail/apexAnalysisDisplay";
import {
  fetchSessionDetail,
  isManualActivity,
  normalizeLaps,
  sessionDetailDeniedMessage,
  type RawLap,
} from "@/features/session-detail/sessionDetailData";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";
import { invalidateSessionDerivedCaches } from "@/lib/profileQueryKeys";
import { toast } from "sonner";
import PageMeta from "@/components/PageMeta";
import DeleteConfirmModalV2 from "@/components/v2/DeleteConfirmModalV2";
import SessionShareModalV2 from "@/components/v2/SessionShareModalV2";
import { useTelemetrySummary, useTelemetryTraces } from "@/features/telemetry-analysis/useSessionTelemetry";
import { isAgentOnlyTelemetryGate } from "@/features/telemetry-analysis/telemetryEligibility";
import SessionDetailBadgesV2 from "./session/SessionDetailBadgesV2";
import SessionDetailHeroV2 from "./session/SessionDetailHeroV2";
import SessionDetailHeroStatsV2 from "./session/SessionDetailHeroStatsV2";
import SessionDetailSectorBreakdownV2 from "./session/SessionDetailSectorBreakdownV2";
import SessionDetailAnalysisGridV2 from "./session/SessionDetailAnalysisGridV2";
import SessionDetailLapConsistencyV2, {
  buildConsistencyVisual,
} from "./session/SessionDetailLapConsistencyV2";
import SessionDetailSkeletonV2 from "./session/SessionDetailSkeletonV2";
import SessionLapTableV2 from "./session/SessionLapTableV2";
import SessionTelemetryV2, {
  aggregateTyreWearPct,
  telemetryOverviewFromTraces,
} from "./session/telemetry/SessionTelemetryV2";

const SESSIONS_V2_PATH = "/v2/sessions";

const PAGE_SHELL_CLASS =
  "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-4 px-6 py-8";

function ordinalSuffix(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (abs % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function SessionsBackLink() {
  return (
    <Link
      to={SESSIONS_V2_PATH}
      className="inline-flex items-center gap-1.5 font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
    >
      <ChevronLeft className="size-4 shrink-0" aria-hidden />
      Sessions
    </Link>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className={PAGE_SHELL_CLASS}>
      <SessionsBackLink />
      {children}
    </div>
  );
}

export default function SessionDetailV2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPro = useIsProUser();
  const [showAllLaps, setShowAllLaps] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLap, setSelectedLap] = useState<number | null>(null);

  const sid = id?.trim() ?? "";
  const detailPath = sid ? `/v2/sessions/${sid}` : SESSIONS_V2_PATH;

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
  const proFeaturesLocked = sessionPayload?.proFeaturesLocked ?? false;

  const shareUrl = useMemo(() => (sid ? publicSessionUrl(sid) : ""), [sid]);

  const onSelectLap = useCallback((lapNumber: number) => {
    setSelectedLap(lapNumber);
  }, []);

  const laps = useMemo(() => {
    if (!session) return [];
    return normalizeLaps(session.laps as RawLap[] | undefined)
      .filter((l) => Number.isFinite(l.lap) && l.lap > 0)
      .sort((a, b) => a.lap - b.lap);
  }, [session]);

  const sessionMinima = useMemo(
    () => session?.sessionTimingMinima ?? EMPTY_SESSION_TIMING_MINIMA,
    [session?.sessionTimingMinima],
  );

  const lapHighlights = useMemo(() => {
    if (laps.length === 0) return new Map();
    return (
      buildHighlightMapFromLaps(laps) ??
      buildHighlightMapFromLaps(laps, { missingAsDefault: true }) ??
      new Map()
    );
  }, [laps]);

  const idealLapMs = useMemo(() => {
    if (!session) return null;
    const fromApi = session.idealLap?.lapTimeMs;
    if (fromApi != null && Number.isFinite(fromApi)) return fromApi;
    if (
      sessionMinima.s1Ms != null &&
      sessionMinima.s2Ms != null &&
      sessionMinima.s3Ms != null
    ) {
      return sessionMinima.s1Ms + sessionMinima.s2Ms + sessionMinima.s3Ms;
    }
    return sessionMinima.lapMs;
  }, [session, sessionMinima]);

  const agentOnlyGate = isAgentOnlyTelemetryGate(session?.ingestPath);
  const { data: telemetrySummary } = useTelemetrySummary(
    sid,
    Boolean(sid && isPro && !agentOnlyGate && session),
  );
  const overviewLap =
    selectedLap ??
    telemetrySummary?.defaultLapNumber ??
    session?.bestLapLapNumber ??
    null;
  const canLoadOverviewTraces = Boolean(
    isPro &&
      telemetrySummary?.eligible &&
      telemetrySummary.hasProAccess &&
      overviewLap != null &&
      telemetrySummary.laps.some(
        (l) => l.lapNumber === overviewLap && l.hasTraces,
      ),
  );
  const { data: overviewTraces } = useTelemetryTraces(
    sid,
    overviewLap,
    null,
    canLoadOverviewTraces,
  );

  if (!sid) {
    return (
      <PageShell>
        <p className="font-v2-body text-sm text-v2-on-surface-variant">
          Missing session ID.
        </p>
      </PageShell>
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
        <PageShell>
          <SessionDetailSkeletonV2 />
        </PageShell>
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
        <PageShell>
          <div className="rounded-xl bg-v2-surface-container-low p-6 font-v2-body text-sm text-v2-on-surface-variant shadow-lg">
            {errorMessage ?? "Session not found."}
          </div>
        </PageShell>
      </>
    );
  }

  const resolved = resolveSessionFields(session);
  const totalLapsCount =
    typeof session.lapCount === "number" && session.lapCount > 0
      ? session.lapCount
      : laps.length;
  const isManual = isManualActivity(session);
  const isOwner = user?.id != null && session.userId === user.id;
  const canEditSession = isOwner;
  const canManualExtras = isManual && isOwner;

  const apexDisplay = parseApexAnalysisDisplay(apexAnalysis);
  const apexLocked = apexDisplay.locked;
  const apexTitle = apexLocked
    ? "Pro insight"
    : apexDisplay.insights.length > 0
      ? "Session insight"
      : "No analysis yet";
  const apexBody = apexLocked
    ? (apexDisplay.message ?? "Upgrade to Apex Pro to unlock Apex Analysis.")
    : apexDisplay.insights.length > 0
      ? apexDisplay.insights.join(" ")
      : "Apex Analysis will appear here once insights are available for this session.";

  const bestLapMsFromLaps = sessionMinima.lapMs ?? session.bestLapMs ?? null;
  const visibleLaps = showAllLaps ? laps : laps.slice(0, 6);
  const canShowMoreLaps = !showAllLaps && laps.length > 6;

  const lapTimes = sanitizeLapTimesForConsistency(laps.map((l) => l.timeMs));
  const realConsistency =
    session.consistencyScore != null &&
    Number.isFinite(session.consistencyScore)
      ? Math.round(session.consistencyScore)
      : calcConsistencyScore(lapTimes);
  const consistencyText =
    realConsistency != null ? `${realConsistency}%` : "—";
  const consistencyVisual = buildConsistencyVisual(
    lapTimes,
    bestLapMsFromLaps,
  );

  // Baseline = first competitive (non-out) lap — Lap 1 is often an out-lap.
  const baselineLap = laps.find(
    (l) =>
      l.isOutLap !== true &&
      l.timeMs > 0 &&
      l.isValid !== false,
  );
  const improvementMs =
    baselineLap != null &&
    bestLapMsFromLaps != null &&
    baselineLap.timeMs > bestLapMsFromLaps
      ? baselineLap.timeMs - bestLapMsFromLaps
      : null;
  const improvementFromLap =
    improvementMs != null && improvementMs > 0 ? baselineLap!.lap : null;

  const showPosition =
    session.position != null &&
    Number.isFinite(session.position) &&
    session.position > 0;
  const displayPositionLabel = showPosition
    ? session.totalDrivers != null && session.totalDrivers > 0
      ? `P${session.position} / ${session.totalDrivers}`
      : `P${session.position}`
    : null;
  const showQualiGrid =
    session.qualifyingPosition != null &&
    session.qualifyingPosition > 0;
  const qualiGridLabel = showQualiGrid
    ? session.totalDrivers != null && session.totalDrivers > 0
      ? `P${session.qualifyingPosition} / ${session.totalDrivers}`
      : `P${session.qualifyingPosition}`
    : null;

  const wearPct = aggregateTyreWearPct(telemetrySummary ?? null);
  const overview = telemetryOverviewFromTraces(overviewTraces);
  const overviewRows: Array<{
    label: string;
    value: string;
    scope: "lap" | "session";
  }> = [
    {
      label: "Top speed",
      scope: "lap",
      value:
        overview.topSpeedKmh != null
          ? `${Math.round(overview.topSpeedKmh)} km/h`
          : "—",
    },
    {
      label: "Avg brake force",
      scope: "lap",
      value:
        overview.avgBrakePct != null
          ? `${Math.round(overview.avgBrakePct)}%`
          : "—",
    },
    {
      label:
        overview.highestGear != null
          ? `Distance in ${overview.highestGear}${ordinalSuffix(overview.highestGear)} gear`
          : "Top gear share",
      scope: "lap",
      value:
        overview.topGearDistancePct != null
          ? `${Math.round(overview.topGearDistancePct)}%`
          : overview.highestGear != null
            ? `Gear ${overview.highestGear}`
            : "—",
    },
  ];
  if (telemetrySummary?.sessionMeta?.airTempC != null) {
    overviewRows.push({
      label: "Air temp",
      scope: "session",
      value: `${telemetrySummary.sessionMeta.airTempC}°C`,
    });
  }
  if (telemetrySummary?.sessionMeta?.trackTempC != null) {
    overviewRows.push({
      label: "Track temp",
      scope: "session",
      value: `${telemetrySummary.sessionMeta.trackTempC}°C`,
    });
  }

  const sessionShareText = buildSessionShareText(session);
  const sessionShareTitle =
    sessionShareText.split("\n")[0]?.trim() || "Apex session";

  async function handleDelete() {
    if (!sid) return;

    try {
      await deleteManualActivity(sid);
      invalidateSessionDerivedCaches(queryClient, {
        sessionId: sid,
        ownerUserId: session.userId ?? user?.id ?? null,
        removeSessionQueries: true,
      });
      toast.success("Activity deleted", {
        description: "The manual activity has been removed.",
      });
      navigate(SESSIONS_V2_PATH);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to delete activity. Please try again.";
      throw new Error(message);
    }
  }

  return (
    <>
      <PageMeta
        title={sessionShareTitle}
        description={sessionShareText}
        path={detailPath}
      />

      <PageShell>
        <SessionDetailBadgesV2
          session={session}
          resolved={resolved}
          isManual={isManual}
        />

        <SessionDetailHeroV2
          trackName={resolved.track}
          trackImageUrl={session.trackImageUrl}
          canEditSession={canEditSession}
          canManualExtras={canManualExtras}
          onShare={() => setShareModalOpen(true)}
          onEdit={() => navigate(`/v2/sessions/${sid}/edit`)}
          onDelete={() => setShowDeleteModal(true)}
          onLogAgain={() =>
            navigate("/v2/manual", {
              state: {
                logAgain: {
                  sim: resolved.sim ?? session.sim ?? undefined,
                  trackId: session.trackId ?? undefined,
                  carId: session.carId ?? undefined,
                },
              },
            })
          }
        />

        <SessionDetailHeroStatsV2
          bestLapMs={session.bestLapMs}
          lapCount={totalLapsCount}
          carName={resolved.car ?? resolved.carRawForFormat ?? null}
          positionLabel={displayPositionLabel}
          qualiGridLabel={qualiGridLabel}
          bestLapLapNumber={session.bestLapLapNumber}
          improvementMs={improvementMs}
          improvementFromLap={improvementFromLap}
          totalKm={session.totalKm}
        />

        <SessionDetailSectorBreakdownV2
          sessionMinima={sessionMinima}
          idealLapMs={idealLapMs}
          proFeaturesLocked={proFeaturesLocked}
        />

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
              Lap history
            </h2>
            {laps.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-v2-body text-[11px] text-v2-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-purple-400">
                    ●
                  </span>
                  Session best
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono">●</span>
                  Normal
                </span>
              </div>
            )}
          </div>
          <SessionLapTableV2
            laps={visibleLaps}
            lapHighlights={lapHighlights}
            bestLapMsFromLaps={bestLapMsFromLaps}
            canShowMore={canShowMoreLaps}
            onShowMore={() => setShowAllLaps(true)}
            selectedLap={selectedLap}
            onSelectLap={onSelectLap}
          />
        </section>

        <SessionDetailAnalysisGridV2
          apexTitle={apexTitle}
          apexBody={apexBody}
          apexLocked={apexLocked}
          apexConsistencyText={consistencyText}
          tireWearText={
            wearPct != null ? `${Math.round(wearPct)}%` : "—"
          }
          overviewRows={overviewRows}
          overviewLapNumber={overviewLap}
        />

        <SessionTelemetryV2
          sessionId={sid}
          ingestPath={session.ingestPath}
          laps={laps}
          selectedLap={selectedLap}
          onSelectLap={onSelectLap}
          bestLapLapNumber={session.bestLapLapNumber}
        />

        <SessionDetailLapConsistencyV2
          consistencyText={consistencyText}
          dots={consistencyVisual.dots}
          narrative={consistencyVisual.narrative}
        />

        {session.compareToPrevious && (
          <section className="rounded-xl bg-v2-surface-container-low p-4 shadow-lg">
            <h2 className="mb-2 font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
              vs previous session
            </h2>
            <div className="flex flex-wrap gap-4 font-v2-body text-xs text-v2-on-surface-variant">
              {session.compareToPrevious.bestLapDiffMs != null && (
                <span>
                  Best lap{" "}
                  <strong className="text-v2-on-surface">
                    {session.compareToPrevious.bestLapDiffMs < 0
                      ? "faster "
                      : "slower "}
                    {formatLapDelta(
                      Math.abs(session.compareToPrevious.bestLapDiffMs),
                    )}
                  </strong>
                </span>
              )}
              {session.compareToPrevious.medianLapDiffMs != null && (
                <span>
                  Median{" "}
                  <strong className="text-v2-on-surface">
                    {session.compareToPrevious.medianLapDiffMs < 0
                      ? "faster "
                      : "slower "}
                    {formatLapDelta(
                      Math.abs(session.compareToPrevious.medianLapDiffMs),
                    )}
                  </strong>
                </span>
              )}
              {session.compareToPrevious.consistencyDiffPct != null && (
                <span>
                  Consistency{" "}
                  <strong className="text-v2-on-surface">
                    {session.compareToPrevious.consistencyDiffPct > 0
                      ? "+"
                      : ""}
                    {session.compareToPrevious.consistencyDiffPct.toFixed(1)} pts
                  </strong>
                </span>
              )}
            </div>
          </section>
        )}

        {session.notes?.trim() ? (
          <section className="rounded-xl bg-v2-surface-container-low p-4 shadow-lg">
            <h2 className="mb-2 font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
              Notes
            </h2>
            <p className="whitespace-pre-wrap font-v2-body text-sm text-v2-on-surface-variant">
              {session.notes.trim()}
            </p>
          </section>
        ) : null}

        {import.meta.env.DEV &&
          session.processingDurationMs != null &&
          Number.isFinite(session.processingDurationMs) && (
            <p className="font-v2-body text-[10px] text-v2-on-surface-variant/60">
              Processing {Math.round(session.processingDurationMs)} ms
            </p>
          )}
      </PageShell>

      <DeleteConfirmModalV2
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete this manual activity?"
        message="This cannot be undone."
      />

      <SessionShareModalV2
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        shareText={sessionShareText}
      />
    </>
  );
}
