import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatLapDelta,
  formatCarName,
  formatLapMs,
  formatTrackName,
  cn,
} from "@/lib/utils";
import {
  formatChallengeDateTime,
  formatChallengeTimeRemaining,
} from "@/lib/datetime";
import {
  getChallenge,
  getChallengeLeaderboard,
  getChallengeEntrantSessions,
  joinChallenge,
  leaveChallenge,
  type ChallengeApiStatus,
} from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { formatSimEnum } from "@/lib/enumFormat";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";

const CHALLENGES_V2_PATH = "/v2/challenges";
const LEADERBOARD_PAGE_SIZE = 20;
const SESSIONS_PAGE_SIZE = 20;

function statusLabel(
  status: ChallengeApiStatus,
): "Live" | "Upcoming" | "Finished" {
  switch (status) {
    case "ACTIVE":
      return "Live";
    case "UPCOMING":
      return "Upcoming";
    case "ENDED":
      return "Finished";
    default:
      return "Finished";
  }
}

function statusBadgeClass(status: "Live" | "Upcoming" | "Finished"): string {
  switch (status) {
    case "Live":
      return "bg-v2-primary text-white";
    case "Upcoming":
      return "border border-blue-500/30 bg-blue-500/15 text-blue-200";
    case "Finished":
      return "border border-v2-outline-variant/30 bg-v2-surface-container-high text-v2-on-surface-variant";
  }
}

type Tab = "overview" | "leaderboard" | "sessions";

const TAB_CONFIG: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "leaderboard", label: "Leaderboard" },
  { key: "sessions", label: "Session links" },
];

const V2_OUTLINE_BTN =
  "inline-flex items-center gap-1 rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container px-3 py-2 font-v2-body text-sm font-medium text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:cursor-not-allowed disabled:opacity-40";

export default function ChallengeDetailV2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [joinBanMessage, setJoinBanMessage] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setLeaderboardPage(1);
    setSessionsPage(1);
    setJoinBanMessage(null);
    setLeaveError(null);
    setConfirmingLeave(false);
  }, [id]);

  const {
    data: challenge,
    isPending: loading,
    error: queryError,
    isError,
  } = useQuery({
    queryKey: ["challenges", "detail", id ?? "", user?.id ?? "anon"],
    queryFn: async () => {
      if (!id) throw new Error("Missing challenge ID");
      const data = await getChallenge(id);
      if (!data) throw new Error("Challenge not found");
      return data;
    },
    enabled: Boolean(id),
  });

  const { data: leaderboardData, isPending: leaderboardLoading } = useQuery({
    queryKey: ["challenges", "leaderboard", id, leaderboardPage],
    queryFn: () =>
      getChallengeLeaderboard(id!, leaderboardPage, LEADERBOARD_PAGE_SIZE),
    enabled: Boolean(id) && tab === "leaderboard",
  });

  const { data: sessionsData, isPending: sessionsLoading } = useQuery({
    queryKey: ["challenges", "entrant-sessions", id, sessionsPage],
    queryFn: () =>
      getChallengeEntrantSessions(id!, sessionsPage, SESSIONS_PAGE_SIZE),
    enabled: Boolean(id) && tab === "sessions" && Boolean(user),
  });

  const joinMutation = useMutation({
    mutationFn: () => joinChallenge(id!),
    onSuccess: () => {
      setJoinBanMessage(null);
      void queryClient.invalidateQueries({
        queryKey: ["challenges", "detail", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["challenges", "summary"],
      });
    },
    onError: (e) => {
      if (
        e instanceof ApiError &&
        e.status === 403 &&
        (e.code === "BANNED" || e.message === "banned")
      ) {
        setJoinBanMessage(
          e.message && e.message !== "banned"
            ? e.message
            : "You are banned from this challenge",
        );
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveChallenge(id!),
    onSuccess: () => {
      setLeaveError(null);
      setConfirmingLeave(false);
      void queryClient.invalidateQueries({
        queryKey: ["challenges", "detail", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["challenges", "summary"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["challenges", "list"],
      });
    },
    onError: (e) => {
      if (
        e instanceof ApiError &&
        e.status === 409 &&
        (e.code === "HAS_POSTS" || e.message === "has_posts")
      ) {
        setLeaveError(
          e.message && e.message !== "has_posts"
            ? e.message
            : "You have already posted to this challenge — leaving is no longer allowed.",
        );
      } else if (e instanceof Error) {
        setLeaveError(e.message || "Failed to leave challenge");
      } else {
        setLeaveError("Failed to leave challenge");
      }
      setConfirmingLeave(false);
    },
  });

  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load challenge"
    : null;

  const countdownMs = useMemo(() => {
    if (!challenge?.countdownTargetIso) return null;
    const t = new Date(challenge.countdownTargetIso).getTime();
    return Math.max(0, t - now);
  }, [challenge, now]);

  const detailPath = id ? `/v2/challenge/${id}` : CHALLENGES_V2_PATH;

  if (!id) {
    return (
      <>
        <PageMeta
          title={`Challenges | ${COMPANY_NAME}`}
          description={`Sim racing challenges on ${COMPANY_NAME}.`}
          path={CHALLENGES_V2_PATH}
          noindex
        />
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto p-4">
          <button
            type="button"
            onClick={() => navigate(CHALLENGES_V2_PATH)}
            className="mb-6 inline-flex items-center gap-2 font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Return
          </button>
          <p className="py-8 font-v2-body text-v2-on-surface-variant">
            Missing challenge ID
          </p>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageMeta
          title={`Challenge | ${COMPANY_NAME}`}
          description={`Loading challenge on ${COMPANY_NAME}.`}
          path={detailPath}
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="font-v2-body text-v2-on-surface-variant">
            Loading challenge…
          </p>
        </div>
      </>
    );
  }

  if (error || !challenge) {
    return (
      <>
        <PageMeta
          title={`Challenge | ${COMPANY_NAME}`}
          description={error ?? "Challenge not found."}
          path={detailPath}
          noindex
        />
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto p-4">
          <button
            type="button"
            onClick={() => navigate(CHALLENGES_V2_PATH)}
            className="mb-6 inline-flex items-center gap-2 font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Return
          </button>
          <p className="py-8 font-v2-body text-v2-on-surface-variant">
            {error ?? "Challenge not found."}
          </p>
        </div>
      </>
    );
  }

  if (challenge.banned) {
    const banText = challenge.banReason
      ? `You are banned from this challenge for this reason: ${challenge.banReason}`
      : "You are banned from this challenge";
    return (
      <>
        <PageMeta
          title={`${challenge.title} | ${COMPANY_NAME}`}
          description={banText}
          path={detailPath}
          noindex
        />
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto p-4">
          <div className="rounded-2xl border border-v2-error/30 bg-v2-error/10 p-6 font-v2-body text-sm text-v2-error">
            <h1 className="mb-2 font-v2-headline text-lg font-semibold text-v2-on-surface">
              {challenge.title}
            </h1>
            <p>{banText}</p>
          </div>
        </div>
      </>
    );
  }

  const status = statusLabel(challenge.status as ChallengeApiStatus);
  const activeTimeRemainingSec =
    challenge.timeRemainingSec != null && challenge.status === "ACTIVE"
      ? challenge.timeRemainingSec
      : null;
  const upcomingScheduleText =
    challenge.status === "UPCOMING" && challenge.startsAt
      ? `Starts ${formatChallengeDateTime(challenge.startsAt)}`
      : null;

  const challengeDesc =
    challenge.description?.trim() ||
    `${formatSimEnum(challenge.sim)} · ${formatTrackName(challenge.track)} — ${COMPANY_NAME} challenge.`;

  const canJoin =
    user &&
    !challenge.joined &&
    challenge.status !== "ENDED" &&
    new Date(challenge.endsAt).getTime() > Date.now();

  const canLeave = Boolean(user && challenge.joined && challenge.canLeave);
  const showLeaveLockedHint = Boolean(
    user && challenge.joined && challenge.canLeave === false,
  );

  const followPreview = challenge.followedWhoJoined ?? [];

  const thirdStatLabel =
    challenge.targetTimeMs != null ? "Target time" : "Drivers";
  const thirdStatValue =
    challenge.targetTimeMs != null
      ? formatLapMs(challenge.targetTimeMs)
      : String(challenge.participants);

  return (
    <>
      <PageMeta
        title={`${challenge.title} | ${COMPANY_NAME}`}
        description={`${challengeDesc.slice(0, 160)}${challengeDesc.length > 160 ? "…" : ""}`}
        path={detailPath}
        ogType="article"
      />
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto p-4">
        {/* Hero card */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container">
          <div className="relative h-48 overflow-hidden sm:h-64">
            <div className="absolute inset-0 bg-gradient-to-t from-v2-background via-v2-surface-container-high to-v2-surface-container" />
            <div
              className={cn(
                "absolute left-4 top-4 flex items-center gap-1 rounded px-2 py-0.5 font-v2-body text-[10px] font-black uppercase",
                statusBadgeClass(status),
              )}
            >
              {status === "Live" && (
                <span className="size-1 animate-pulse rounded-full bg-white" />
              )}
              {status}
            </div>
            {countdownMs != null &&
              challenge.status !== "ENDED" &&
              countdownMs > 0 && (
                <div className="absolute right-4 top-4 font-v2-body text-[11px] font-medium text-v2-on-surface drop-shadow-md">
                  {challenge.status === "UPCOMING" ? "Starts in " : "Ends in "}
                  <span className="font-bold">
                    {formatChallengeTimeRemaining(
                      Math.floor(countdownMs / 1000),
                    )}
                  </span>
                </div>
              )}
            <div className="absolute inset-x-6 bottom-6">
              <h2 className="font-v2-headline text-2xl font-bold tracking-tight text-v2-on-surface sm:text-3xl">
                {challenge.title}
              </h2>
              {challenge.description && (
                <p className="mt-1 line-clamp-2 font-v2-body text-sm text-v2-on-surface-variant">
                  {challenge.description}
                </p>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                  Sim
                </p>
                <p className="font-v2-body text-sm font-bold text-v2-on-surface">
                  {formatSimEnum(challenge.sim)}
                </p>
              </div>
              <div>
                <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                  {challenge.targetTimeMs != null ? "Track" : "Vehicle"}
                </p>
                <p className="font-v2-body text-sm font-bold text-v2-on-surface">
                  {challenge.targetTimeMs != null
                    ? formatTrackName(challenge.track)
                    : formatCarName(challenge.carClass ?? challenge.vehicle)}
                </p>
              </div>
              <div>
                <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                  {thirdStatLabel}
                </p>
                <p className="font-v2-body text-sm font-bold text-v2-on-surface">
                  {thirdStatValue}
                </p>
              </div>
            </div>

            {canJoin && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={joinMutation.isPending}
                  onClick={() => joinMutation.mutate()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-v2-primary py-3.5 font-v2-body text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-v2-primary/90 active:scale-[0.98] disabled:opacity-60"
                >
                  {joinMutation.isPending ? "Joining…" : "Join challenge"}
                </button>
                {joinBanMessage && (
                  <div
                    role="alert"
                    className="rounded-lg border border-v2-error/30 bg-v2-error/10 px-4 py-2 font-v2-body text-xs text-v2-error"
                  >
                    {joinBanMessage}
                  </div>
                )}
              </div>
            )}

            {!canJoin && challenge.joined && (
              <div className="flex flex-col gap-2">
                <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-v2-outline-variant/20 bg-v2-surface-container-high py-3.5 font-v2-body text-sm font-bold uppercase tracking-wider text-v2-on-surface">
                  <CheckCircle className="size-5 text-v2-primary" aria-hidden />
                  Joined
                </div>
                {canLeave && !confirmingLeave && (
                  <button
                    type="button"
                    disabled={leaveMutation.isPending}
                    onClick={() => {
                      setLeaveError(null);
                      setConfirmingLeave(true);
                    }}
                    className="w-full rounded-xl border border-v2-outline-variant/20 bg-v2-surface-container py-2.5 font-v2-body text-sm font-medium text-v2-on-surface-variant transition-colors hover:bg-v2-surface-container-high hover:text-v2-on-surface"
                  >
                    Leave challenge
                  </button>
                )}
                {canLeave && confirmingLeave && (
                  <div className="flex flex-col gap-2">
                    <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
                      Leave this challenge?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={leaveMutation.isPending}
                        onClick={() => leaveMutation.mutate()}
                        className="flex-1 rounded-xl bg-v2-error py-2.5 font-v2-body text-sm font-bold text-white transition-colors hover:bg-v2-error/90 disabled:opacity-60"
                      >
                        {leaveMutation.isPending ? "Leaving…" : "Confirm leave"}
                      </button>
                      <button
                        type="button"
                        disabled={leaveMutation.isPending}
                        onClick={() => setConfirmingLeave(false)}
                        className="flex-1 rounded-xl border border-v2-outline-variant/20 py-2.5 font-v2-body text-sm font-medium text-v2-on-surface-variant transition-colors hover:bg-v2-surface-container-high"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {showLeaveLockedHint && (
                  <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
                    You can&apos;t leave after posting a session.
                  </p>
                )}
                {leaveError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-v2-error/30 bg-v2-error/10 px-4 py-2 font-v2-body text-xs text-v2-error"
                  >
                    {leaveError}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {followPreview.length > 0 && (
          <div className="mb-5 rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container px-4 py-3 font-v2-body text-sm text-v2-on-surface-variant">
            <span className="text-v2-on-surface">
              {followPreview.map((f) => f.displayName).join(", ")}
            </span>{" "}
            {followPreview.length === 1 ? "has" : "have"} joined — compete with
            people you follow.
          </div>
        )}

        <section className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {TAB_CONFIG.map(({ key, label }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "shrink-0 rounded-md px-4 py-2 font-v2-body text-xs font-bold transition-colors",
                  isActive
                    ? "bg-v2-primary text-white"
                    : "bg-v2-surface-container-low text-v2-on-surface-variant hover:text-v2-on-surface",
                )}
              >
                {label}
              </button>
            );
          })}
        </section>

        {tab === "overview" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container p-6">
              <h3 className="mb-6 font-v2-body text-xs font-semibold uppercase tracking-wider text-v2-on-surface-variant">
                Challenge details
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                    Sim
                  </p>
                  <p className="font-v2-body text-sm font-medium text-v2-on-surface">
                    {formatSimEnum(challenge.sim)}
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                    Track
                  </p>
                  <p className="font-v2-body text-sm font-medium text-v2-on-surface">
                    {formatTrackName(challenge.track)}
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                    Car class
                  </p>
                  <p className="font-v2-body text-sm font-medium text-v2-on-surface">
                    {formatCarName(challenge.carClass ?? challenge.vehicle)}
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                    Drivers
                  </p>
                  <p className="font-v2-body text-sm font-medium text-v2-on-surface">
                    {challenge.participants}
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                    Starts
                  </p>
                  <p className="font-v2-body text-sm font-medium text-v2-on-surface">
                    {formatChallengeDateTime(challenge.startsAt)}
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                    Ends
                  </p>
                  <p className="font-v2-body text-sm font-medium text-v2-on-surface">
                    {formatChallengeDateTime(challenge.endsAt)}
                  </p>
                </div>
              </div>

              {challenge.joined && challenge.status === "ACTIVE" && (
                <div className="mt-6 flex flex-wrap gap-3 border-t border-v2-outline-variant/15 pt-6">
                  <Link
                    to="/manual"
                    state={{ challengeId: id }}
                    className="rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container-high px-4 py-2 font-v2-body text-sm font-medium text-v2-on-surface transition-colors hover:bg-v2-surface-container"
                  >
                    Log manual lap
                  </Link>
                  <Link
                    to={`/upload?challenge=${encodeURIComponent(id)}`}
                    className="rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container-high px-4 py-2 font-v2-body text-sm font-medium text-v2-on-surface transition-colors hover:bg-v2-surface-container"
                  >
                    Upload .ibt
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container p-6">
              <h3 className="mb-6 font-v2-body text-xs font-semibold uppercase tracking-wider text-v2-on-surface-variant">
                Your performance
              </h3>
              <div className="space-y-4">
                {challenge.yourPosition != null ? (
                  <div className="rounded-xl bg-v2-surface-container-high p-4">
                    <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                      Position
                    </p>
                    <p className="font-v2-headline text-3xl font-bold text-v2-primary">
                      #{challenge.yourPosition}
                    </p>
                    <p className="mt-2 font-v2-body text-xs text-v2-on-surface-variant">
                      of {challenge.participants} drivers
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-v2-surface-container-high p-4">
                    <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                      Status
                    </p>
                    <p className="font-v2-body text-sm font-medium text-v2-on-surface">
                      {status}
                    </p>
                    {activeTimeRemainingSec != null && (
                      <p className="mt-2 font-v2-body text-xs text-v2-on-surface-variant">
                        {formatChallengeTimeRemaining(activeTimeRemainingSec)}{" "}
                        remaining
                      </p>
                    )}
                    {activeTimeRemainingSec == null && upcomingScheduleText && (
                      <p className="mt-2 font-v2-body text-xs text-v2-on-surface-variant">
                        {upcomingScheduleText}
                      </p>
                    )}
                  </div>
                )}

                {challenge.yourBestLapMs != null && (
                  <div className="rounded-xl bg-v2-surface-container-high p-4">
                    <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                      Your best
                    </p>
                    <p className="font-v2-headline text-2xl font-bold text-v2-on-surface">
                      {formatLapMs(challenge.yourBestLapMs)}
                    </p>
                    {challenge.fastestLapMs != null &&
                      challenge.yourBestLapMs - challenge.fastestLapMs > 0 && (
                        <p className="mt-1 font-v2-body text-xs text-v2-on-surface-variant">
                          +{" "}
                          {formatLapDelta(
                            challenge.yourBestLapMs - challenge.fastestLapMs,
                          )}
                        </p>
                      )}
                  </div>
                )}

                <div className="rounded-xl bg-v2-surface-container-high p-4">
                  <p className="mb-2 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                    Fastest
                  </p>
                  <p className="font-v2-headline text-2xl font-bold text-v2-on-surface">
                    {challenge.fastestLapMs != null
                      ? formatLapMs(challenge.fastestLapMs)
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-v2-body text-xs font-semibold uppercase tracking-wider text-v2-on-surface-variant">
                Leaderboard
                {leaderboardData?.total != null && (
                  <span className="ml-2 font-normal">
                    ({leaderboardData.total})
                  </span>
                )}
              </h3>
              {leaderboardData && leaderboardData.totalPages > 1 && (
                <p className="font-v2-body text-xs text-v2-on-surface-variant">
                  Page {leaderboardData.page} / {leaderboardData.totalPages}
                </p>
              )}
            </div>
            {leaderboardLoading ? (
              <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
                Loading…
              </p>
            ) : !leaderboardData?.items?.length ? (
              <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
                No laps recorded yet.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-v2-body text-sm">
                    <thead>
                      <tr className="border-b border-v2-outline-variant/15 text-v2-on-surface-variant">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">Driver</th>
                        <th className="py-2 pr-4">Best lap</th>
                        <th className="py-2 pr-4">Date set</th>
                        <th className="py-2 pr-4">Attempts</th>
                        <th className="py-2">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.items.map((row) => (
                        <tr
                          key={`${row.userId}-${row.rank}`}
                          className="border-b border-v2-outline-variant/10"
                        >
                          <td className="py-2 pr-4 tabular-nums text-v2-on-surface">
                            {row.rank}
                          </td>
                          <td className="py-2 pr-4 text-v2-on-surface">
                            <span className="inline-flex items-center gap-2">
                              {row.username}
                              {row.isPro && (
                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                                  Pro
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-mono text-v2-on-surface">
                            {formatLapMs(row.bestLapMs)}
                          </td>
                          <td className="py-2 pr-4 text-v2-on-surface-variant">
                            {formatChallengeDateTime(row.bestLapAt)}
                          </td>
                          <td className="py-2 pr-4 text-v2-on-surface">
                            {row.attemptCount}
                          </td>
                          <td className="py-2">
                            {row.verification === "VERIFIED" ? (
                              <span className="text-v2-success">Verified</span>
                            ) : (
                              <span className="text-amber-400">Manual</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {leaderboardData.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={leaderboardPage <= 1}
                      onClick={() =>
                        setLeaderboardPage((p) => Math.max(1, p - 1))
                      }
                      className={V2_OUTLINE_BTN}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={leaderboardPage >= leaderboardData.totalPages}
                      onClick={() =>
                        setLeaderboardPage((p) =>
                          Math.min(leaderboardData.totalPages, p + 1),
                        )
                      }
                      className={V2_OUTLINE_BTN}
                    >
                      Next
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "sessions" && (
          <div className="rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-v2-body text-xs font-semibold uppercase tracking-wider text-v2-on-surface-variant">
                Session details
                {sessionsData?.total != null && (
                  <span className="ml-2 font-normal">
                    ({sessionsData.total})
                  </span>
                )}
              </h3>
              {sessionsData && sessionsData.totalPages > 1 && (
                <p className="font-v2-body text-xs text-v2-on-surface-variant">
                  Page {sessionsData.page} / {sessionsData.totalPages}
                </p>
              )}
            </div>
            {!user ? (
              <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
                Sign in to browse entrants&apos; sessions.
              </p>
            ) : sessionsLoading ? (
              <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
                Loading…
              </p>
            ) : !sessionsData?.items?.length ? (
              <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
                No linked sessions yet.
              </p>
            ) : (
              <>
                <ul className="space-y-3 font-v2-body text-sm">
                  {sessionsData.items.map((row) => (
                    <li
                      key={row.userId}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-v2-outline-variant/10 py-2"
                    >
                      <span className="text-v2-on-surface">{row.username}</span>
                      <span className="font-mono text-v2-on-surface-variant">
                        {formatLapMs(row.bestLapMs)}
                      </span>
                      {row.sessionId ? (
                        <Link
                          to={`/sessions/${row.sessionId}`}
                          className="text-v2-primary underline-offset-4 hover:underline"
                        >
                          View session
                        </Link>
                      ) : (
                        <span className="text-v2-on-surface-variant">—</span>
                      )}
                    </li>
                  ))}
                </ul>
                {sessionsData.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={sessionsPage <= 1}
                      onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                      className={V2_OUTLINE_BTN}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={sessionsPage >= sessionsData.totalPages}
                      onClick={() =>
                        setSessionsPage((p) =>
                          Math.min(sessionsData.totalPages, p + 1),
                        )
                      }
                      className={V2_OUTLINE_BTN}
                    >
                      Next
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
