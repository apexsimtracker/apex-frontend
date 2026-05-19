import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { formatLapDelta, formatCarName, formatLapMs, formatTrackName } from "@/lib/utils";
import { formatChallengeDateTime, formatChallengeTimeRemaining } from "@/lib/datetime";
import {
  getChallengeLeaderboard,
  getChallengeEntrantSessions,
  getCompetition,
  joinChallenge,
  leaveChallenge,
  type ChallengeApiStatus,
  type CompetitionDetail,
} from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { formatSimEnum } from "@/lib/enumFormat";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const LEADERBOARD_PAGE_SIZE = 20;
const SESSIONS_PAGE_SIZE = 20;

function statusLabel(status: ChallengeApiStatus): "Live" | "Upcoming" | "Finished" {
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

type Tab = "overview" | "leaderboard" | "sessions";

export default function ChallengeDetail() {
  const { id } = useParams();
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
      const data = await getCompetition(id);
      if (!data) throw new Error("Challenge not found");
      return data as CompetitionDetail;
    },
    enabled: Boolean(id),
  });

  const { data: leaderboardData, isPending: leaderboardLoading } = useQuery({
    queryKey: ["challenges", "leaderboard", id, leaderboardPage],
    queryFn: () => getChallengeLeaderboard(id!, leaderboardPage, LEADERBOARD_PAGE_SIZE),
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
      void queryClient.invalidateQueries({ queryKey: ["challenges", "detail", id] });
      void queryClient.invalidateQueries({ queryKey: ["challenges", "summary"] });
    },
    onError: (e) => {
      /**
       * Public join returns 403 with a prebuilt message when the viewer is
       * banned from this challenge. Surface that message inline next to the
       * Join button instead of a generic toast.
       */
      if (
        e instanceof ApiError &&
        e.status === 403 &&
        (e.code === "BANNED" || e.message === "banned")
      ) {
        setJoinBanMessage(
          e.message && e.message !== "banned"
            ? e.message
            : "You are banned from this challenge"
        );
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveChallenge(id!),
    onSuccess: () => {
      setLeaveError(null);
      setConfirmingLeave(false);
      void queryClient.invalidateQueries({ queryKey: ["challenges", "detail", id] });
      void queryClient.invalidateQueries({ queryKey: ["challenges", "summary"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges", "list"] });
    },
    onError: (e) => {
      /**
       * Server enforces the no-posts rule: 409 HAS_POSTS surfaces inline so
       * the viewer sees why leaving was rejected without a generic toast.
       */
      if (
        e instanceof ApiError &&
        e.status === 409 &&
        (e.code === "HAS_POSTS" || e.message === "has_posts")
      ) {
        setLeaveError(
          e.message && e.message !== "has_posts"
            ? e.message
            : "You have already posted to this challenge — leaving is no longer allowed."
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
  }, [challenge?.countdownTargetIso, now]);

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Challenges | ${COMPANY_NAME}`}
          description={`Sim racing challenges on ${COMPANY_NAME}.`}
          path="/challenges"
          noindex
        />
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
      <>
        <PageMeta
          title={`Challenge | ${COMPANY_NAME}`}
          description={`Loading challenge on ${COMPANY_NAME}.`}
          path={`/challenge/${id ?? ""}`}
        />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <p className="text-muted-foreground">Loading challenge…</p>
        </div>
      </>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Challenge | ${COMPANY_NAME}`}
          description={error ?? "Challenge not found."}
          path={`/challenge/${id ?? ""}`}
          noindex
        />
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

  /**
   * Banned viewers receive a skeleton from the API (only id/title/banned/banReason).
   * Render a focused ban card and stop — no countdown, leaderboard, or join CTA.
   */
  if (challenge.banned) {
    const banText = challenge.banReason
      ? `You are banned from this challenge for this reason: ${challenge.banReason}`
      : "You are banned from this challenge";
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`${challenge.title} | ${COMPANY_NAME}`}
          description={banText}
          path={`/challenge/${id}`}
          noindex
        />
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <button
            onClick={() => navigate("/challenges")}
            className="mb-8 flex items-center gap-2 rounded-lg border border-white/20 bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80"
          >
            <ArrowLeft className="size-4" />
            Return
          </button>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
            <h1 className="mb-2 text-lg font-semibold text-red-100">
              {challenge.title}
            </h1>
            <p>{banText}</p>
          </div>
        </div>
      </div>
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
    user && challenge.joined && challenge.canLeave === false
  );

  const followPreview = challenge.followedWhoJoined ?? [];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${challenge.title} | ${COMPANY_NAME}`}
        description={`${challengeDesc.slice(0, 160)}${challengeDesc.length > 160 ? "…" : ""}`}
        path={`/challenge/${id}`}
        ogType="article"
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <button
          onClick={() => navigate("/challenges")}
          className="mb-8 flex items-center gap-2 rounded-lg border border-white/20 bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80"
        >
          <ArrowLeft className="size-4" />
          Return
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
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
            <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">{challenge.title}</h1>
            <p className="text-sm text-muted-foreground/70">{challenge.description ?? "No description."}</p>
          </div>
          {canJoin && (
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Button
                type="button"
                disabled={joinMutation.isPending}
                onClick={() => joinMutation.mutate()}
              >
                {joinMutation.isPending ? "Joining…" : "Join challenge"}
              </Button>
              {joinBanMessage && (
                <div
                  role="alert"
                  className="max-w-sm rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200"
                >
                  {joinBanMessage}
                </div>
              )}
            </div>
          )}
          {!canJoin && (canLeave || showLeaveLockedHint) && (
            <div className="flex shrink-0 flex-col items-end gap-2">
              {canLeave && !confirmingLeave && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={leaveMutation.isPending}
                  onClick={() => {
                    setLeaveError(null);
                    setConfirmingLeave(true);
                  }}
                >
                  Leave challenge
                </Button>
              )}
              {canLeave && confirmingLeave && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground">Leave this challenge?</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={leaveMutation.isPending}
                    onClick={() => leaveMutation.mutate()}
                  >
                    {leaveMutation.isPending ? "Leaving…" : "Confirm leave"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={leaveMutation.isPending}
                    onClick={() => setConfirmingLeave(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {showLeaveLockedHint && (
                <p className="max-w-xs text-right text-xs text-muted-foreground">
                  You can&apos;t leave after posting a session.
                </p>
              )}
              {leaveError && (
                <div
                  role="alert"
                  className="max-w-sm rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200"
                >
                  {leaveError}
                </div>
              )}
            </div>
          )}
        </div>

        {countdownMs != null &&
          challenge.status !== "ENDED" &&
          countdownMs > 0 && (
            <p className="mb-6 font-mono text-sm text-muted-foreground">
              {challenge.status === "UPCOMING" ? "Starts in " : "Ends in "}
              {formatChallengeTimeRemaining(Math.floor(countdownMs / 1000))}
            </p>
          )}

        {followPreview.length > 0 && (
          <div className="mb-6 rounded-lg border border-white/10 bg-card/20 px-4 py-3 text-sm text-muted-foreground">
            <span className="text-foreground">
              {followPreview.map((f) => f.displayName).join(", ")}
            </span>{" "}
            {followPreview.length === 1 ? "has" : "have"} joined — compete with people you follow.
          </div>
        )}

        <div className="mb-8 flex gap-4 border-b border-white/10 pb-2">
          {(["overview", "leaderboard", "sessions"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`text-sm font-medium capitalize ${
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              {t === "sessions" ? "Session links" : t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="border-white/6 mb-8 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
                  <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
                    Challenge details
                  </h2>

                  <div className="mb-8 grid grid-cols-2 gap-6">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Sim</p>
                      <p className="text-base font-medium text-white">{formatSimEnum(challenge.sim)}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Track</p>
                      <p className="text-base font-medium text-white">
                        {formatTrackName(challenge.track)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Car class</p>
                      <p className="text-base font-medium text-white">
                        {formatCarName(challenge.carClass ?? challenge.vehicle)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Drivers</p>
                      <p className="text-base font-medium text-white">{challenge.participants}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Starts</p>
                      <p className="text-base font-medium text-white">
                        {formatChallengeDateTime(challenge.startsAt)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Ends</p>
                      <p className="text-base font-medium text-white">
                        {formatChallengeDateTime(challenge.endsAt)}
                      </p>
                    </div>
                  </div>

                  {challenge.joined && challenge.status === "ACTIVE" && (
                    <div className="border-white/3 flex flex-wrap gap-3 border-t pt-6">
                      <Button asChild variant="secondary" size="sm">
                        <Link to="/manual" state={{ challengeId: id }}>
                          Log manual lap
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" size="sm">
                        <Link to={`/upload?challenge=${encodeURIComponent(id)}`}>Upload .ibt</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="border-white/6 sticky top-20 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
                  <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
                    Your performance
                  </h2>

                  <div className="space-y-6">
                    {challenge.yourPosition != null ? (
                      <div className="bg-white/3 rounded-lg p-4">
                        <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Position</p>
                        <p className="text-3xl font-bold" style={{ color: "rgb(240, 28, 28)" }}>
                          #{challenge.yourPosition}
                        </p>
                        <p className="mt-2 text-xs text-white/60">of {challenge.participants} drivers</p>
                      </div>
                    ) : (
                      <div className="bg-white/3 rounded-lg p-4">
                        <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Status</p>
                        <p className="text-sm font-medium text-white">{status}</p>
                        {activeTimeRemainingSec != null && (
                          <p className="mt-2 text-xs text-white/60">
                            {formatChallengeTimeRemaining(activeTimeRemainingSec)} remaining
                          </p>
                        )}
                        {activeTimeRemainingSec == null && upcomingScheduleText && (
                          <p className="mt-2 text-xs text-white/60">{upcomingScheduleText}</p>
                        )}
                      </div>
                    )}

                    {challenge.yourBestLapMs != null && (
                      <div className="bg-white/3 rounded-lg p-4">
                        <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Your best</p>
                        <div className="mb-3">
                          <p className="text-2xl font-bold text-white">{formatLapMs(challenge.yourBestLapMs)}</p>
                          {challenge.fastestLapMs != null &&
                            challenge.yourBestLapMs - challenge.fastestLapMs > 0 && (
                              <p className="mt-1 text-xs text-white/60">
                                + {formatLapDelta(challenge.yourBestLapMs - challenge.fastestLapMs)}
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    <div className="bg-white/3 rounded-lg p-4">
                      <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Fastest</p>
                      <p className="text-2xl font-bold text-white">
                        {challenge.fastestLapMs != null ? formatLapMs(challenge.fastestLapMs) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "leaderboard" && (
          <div className="border-white/6 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                Leaderboard
                {leaderboardData?.total != null && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({leaderboardData.total})
                  </span>
                )}
              </h2>
              {leaderboardData && leaderboardData.totalPages > 1 && (
                <p className="text-xs text-muted-foreground">
                  Page {leaderboardData.page} / {leaderboardData.totalPages}
                </p>
              )}
            </div>
            {leaderboardLoading ? (
              <p className="py-4 text-sm text-muted-foreground">Loading…</p>
            ) : !leaderboardData?.items?.length ? (
              <p className="py-4 text-sm text-muted-foreground">No laps recorded yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-muted-foreground">
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
                          className="border-b border-white/5"
                        >
                          <td className="py-2 pr-4 tabular-nums">{row.rank}</td>
                          <td className="py-2 pr-4">
                            <span className="inline-flex items-center gap-2">
                              {row.username}
                              {row.isPro && (
                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                                  Pro
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-mono">{formatLapMs(row.bestLapMs)}</td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {formatChallengeDateTime(row.bestLapAt)}
                          </td>
                          <td className="py-2 pr-4">{row.attemptCount}</td>
                          <td className="py-2">
                            {row.verification === "VERIFIED" ? (
                              <span className="text-emerald-400">Verified</span>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={leaderboardPage <= 1}
                      onClick={() => setLeaderboardPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={leaderboardPage >= leaderboardData.totalPages}
                      onClick={() =>
                        setLeaderboardPage((p) =>
                          Math.min(leaderboardData.totalPages, p + 1)
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "sessions" && (
          <div className="border-white/6 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                Session details
                {sessionsData?.total != null && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({sessionsData.total})
                  </span>
                )}
              </h2>
              {sessionsData && sessionsData.totalPages > 1 && (
                <p className="text-xs text-muted-foreground">
                  Page {sessionsData.page} / {sessionsData.totalPages}
                </p>
              )}
            </div>
            {!user ? (
              <p className="py-4 text-sm text-muted-foreground">Sign in to browse entrants&apos; sessions.</p>
            ) : sessionsLoading ? (
              <p className="py-4 text-sm text-muted-foreground">Loading…</p>
            ) : !sessionsData?.items?.length ? (
              <p className="py-4 text-sm text-muted-foreground">No linked sessions yet.</p>
            ) : (
              <>
                <ul className="space-y-3 text-sm">
                  {sessionsData.items.map((row) => (
                    <li
                      key={row.userId}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2"
                    >
                      <span>{row.username}</span>
                      <span className="font-mono text-muted-foreground">{formatLapMs(row.bestLapMs)}</span>
                      {row.sessionId ? (
                        <Link
                          to={`/sessions/${row.sessionId}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          View session
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </li>
                  ))}
                </ul>
                {sessionsData.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={sessionsPage <= 1}
                      onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={sessionsPage >= sessionsData.totalPages}
                      onClick={() =>
                        setSessionsPage((p) =>
                          Math.min(sessionsData.totalPages, p + 1)
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
