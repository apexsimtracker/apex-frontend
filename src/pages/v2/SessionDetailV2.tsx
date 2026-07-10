import { useMemo, useState, type ReactNode } from "react";
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
import { parseApexAnalysisDisplay } from "@/features/session-detail/apexAnalysisDisplay";
import {
  fetchSessionDetail,
  isManualActivity,
  normalizeLaps,
  sessionDetailDeniedMessage,
  type RawLap,
} from "@/features/session-detail/sessionDetailData";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateSessionDerivedCaches } from "@/lib/profileQueryKeys";
import { toast } from "sonner";
import PageMeta from "@/components/PageMeta";
import DeleteConfirmModalV2 from "@/components/v2/DeleteConfirmModalV2";
import SessionShareModalV2 from "@/components/v2/SessionShareModalV2";
import SessionDetailBadgesV2 from "./session/SessionDetailBadgesV2";
import SessionDetailHeroV2 from "./session/SessionDetailHeroV2";
import SessionDetailHeroStatsV2 from "./session/SessionDetailHeroStatsV2";
import SessionDetailSectorBreakdownV2 from "./session/SessionDetailSectorBreakdownV2";
import SessionDetailAnalysisGridV2 from "./session/SessionDetailAnalysisGridV2";
import SessionDetailLapConsistencyV2 from "./session/SessionDetailLapConsistencyV2";
import SessionDetailSkeletonV2 from "./session/SessionDetailSkeletonV2";
import SessionLapTableV2 from "./session/SessionLapTableV2";
import {
  DUMMY_APEX_TEXT,
  DUMMY_BEST_LAP_MS,
  DUMMY_LAP_HIGHLIGHTS,
  DUMMY_LAPS,
} from "./session/sessionDetailDummyData";
import SessionTelemetryDemoV2 from "./session/SessionTelemetryDemoV2";

const SESSIONS_V2_PATH = "/v2/sessions";

const PAGE_SHELL_CLASS =
  "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-4 px-6 py-8";

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
  const [showAllLaps, setShowAllLaps] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const shareUrl = useMemo(() => (sid ? publicSessionUrl(sid) : ""), [sid]);

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

  const realLapHighlights = useMemo(() => {
    if (laps.length === 0) return new Map();
    return (
      buildHighlightMapFromLaps(laps) ??
      buildHighlightMapFromLaps(laps, { missingAsDefault: true }) ??
      new Map()
    );
  }, [laps]);

  const idealLapMs = useMemo(() => {
    if (!session) return null;
    const fromApi = (
      session as { idealLap?: { lapTimeMs?: number | null } | null }
    )?.idealLap?.lapTimeMs;
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
  const apexBody =
    !apexDisplay.locked && apexDisplay.insights.length > 0
      ? apexDisplay.insights[0]
      : DUMMY_APEX_TEXT;

  const hasRealLaps = laps.length > 0;
  const allLaps = hasRealLaps ? laps : DUMMY_LAPS;
  const lapHighlights = hasRealLaps ? realLapHighlights : DUMMY_LAP_HIGHLIGHTS;
  const bestLapMsFromLaps = hasRealLaps
    ? sessionMinima.lapMs
    : DUMMY_BEST_LAP_MS;
  const visibleLaps = showAllLaps ? allLaps : allLaps.slice(0, 6);
  const canShowMoreLaps = !showAllLaps && allLaps.length > 6;

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
        />

        <SessionDetailSectorBreakdownV2
          sessionMinima={sessionMinima}
          idealLapMs={idealLapMs}
        />

        <section className="space-y-3">
          <h2 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
            Lap history
          </h2>
          <SessionLapTableV2
            laps={visibleLaps}
            lapHighlights={lapHighlights}
            bestLapMsFromLaps={bestLapMsFromLaps}
            canShowMore={canShowMoreLaps}
            onShowMore={() => setShowAllLaps(true)}
          />
        </section>

        <SessionDetailAnalysisGridV2
          apexBody={apexBody}
          apexConsistencyText={apexConsistencyText}
        />

        <SessionTelemetryDemoV2 />

        <SessionDetailLapConsistencyV2 consistencyText={lapConsistencyText} />
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
