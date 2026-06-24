import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import ChallengeBrowseCard from "@/components/ChallengeBrowseCard";
import { ChallengeBrowseGridSkeleton } from "@/components/ChallengeBrowseCardSkeleton";
import {
  getChallengeList,
  getChallengesMeta,
  getChallengesSocialPreview,
  joinChallenge,
  type ChallengeListParams,
} from "@/lib/api";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthRedirectState } from "@/auth/authRedirect";

const CHALLENGES_PATH = "/challenges";
const challengesTitle = `Challenges | ${COMPANY_NAME}`;
const challengesDescription = `Sim racing challenges and tournaments on ${COMPANY_NAME}: compete, qualify, and climb leaderboards.`;

const PAGE_SIZE = 12;
const SKELETON_COUNT = 6;
const META_STALE_MS = 5 * 60_000;

type BrowseTab = "upcoming" | "live" | "past" | "joined";

function listParamsForTab(tab: BrowseTab): ChallengeListParams {
  switch (tab) {
    case "upcoming":
      return { status: "UPCOMING", sort: "startsAtAsc" };
    case "live":
      return { status: "ACTIVE", sort: "startsAtDesc" };
    case "past":
      return { status: "ENDED", sort: "startsAtDesc" };
    case "joined":
      return { joinedOnly: true, sort: "startsAtDesc" };
    default:
      return {};
  }
}

export default function Challenges() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [joinError, setJoinError] = useState<string | null>(null);
  const [tab, setTab] = useState<BrowseTab>("upcoming");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [simFilter, setSimFilter] = useState<string>("");
  const [carClassFilter, setCarClassFilter] = useState("");

  const joinedTabLoggedOut = tab === "joined" && !user;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedQ, simFilter, carClassFilter]);

  const listParams = {
    page,
    pageSize: PAGE_SIZE,
    ...listParamsForTab(tab),
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(simFilter ? { sim: simFilter } : {}),
    ...(carClassFilter.trim() ? { carClass: carClassFilter.trim() } : {}),
  };

  const listQueryKey = useMemo(
    () =>
      [
        "challenges",
        "list",
        user?.id ?? "anon",
        tab,
        page,
        debouncedQ,
        simFilter,
        carClassFilter,
      ] as const,
    [user?.id, tab, page, debouncedQ, simFilter, carClassFilter]
  );

  const listQueryKeySerialized = JSON.stringify(listQueryKey);
  const [settledListQueryKey, setSettledListQueryKey] = useState(listQueryKeySerialized);

  const {
    data: listData,
    isPending: listLoading,
    isFetching: listFetching,
    error: listError,
    isError: listFailed,
  } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => getChallengeList(listParams),
    enabled: !joinedTabLoggedOut,
  });

  useEffect(() => {
    if (!listFetching) {
      setSettledListQueryKey(listQueryKeySerialized);
    }
  }, [listFetching, listQueryKeySerialized]);

  const challengeIds = useMemo(
    () => (listData?.items ?? []).map((c) => c.id),
    [listData?.items]
  );

  const { data: socialData } = useQuery({
    queryKey: ["challenges", "social", user?.id, challengeIds],
    queryFn: () => getChallengesSocialPreview(challengeIds),
    enabled: Boolean(user) && challengeIds.length > 0,
  });

  const { data: meta = null } = useQuery({
    queryKey: ["challenges", "meta", user?.id],
    queryFn: () => getChallengesMeta(),
    retry: false,
    enabled: Boolean(user),
    staleTime: META_STALE_MS,
  });

  const joinMutation = useMutation({
    mutationFn: (challengeId: string) => joinChallenge(challengeId),
    onSuccess: (_, challengeId) => {
      void queryClient.invalidateQueries({ queryKey: ["challenges", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges", "social"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges", "meta"] });
      void queryClient.invalidateQueries({
        queryKey: ["challenges", "detail", challengeId],
      });
    },
    onError: (e: unknown) => {
      console.error(e);
      setJoinError(
        typeof (e as Error)?.message === "string"
          ? (e as Error).message
          : "Join failed"
      );
    },
  });

  function handleJoin(challengeId: string) {
    if (!user) {
      const state: AuthRedirectState = {
        message: "Sign in to join challenges and track your results.",
        from: `${location.pathname}${location.search}`,
      };
      navigate("/login", { state });
      return;
    }
    setJoinError(null);
    joinMutation.mutate(challengeId);
  }

  const joiningId = joinMutation.isPending ? joinMutation.variables ?? null : null;

  const error = listFailed
    ? listError instanceof Error
      ? listError.message
      : String(listError)
    : null;

  const items = useMemo(() => {
    const base = listData?.items ?? [];
    if (!socialData?.previews) return base;
    return base.map((item) => {
      const social = socialData.previews[item.id];
      if (!social) return item;
      return {
        ...item,
        followedWhoJoined: social.preview,
        followedWhoJoinedMoreCount: social.moreCount,
      };
    });
  }, [listData?.items, socialData]);

  const totalPages = listData?.totalPages ?? 1;
  const total = joinedTabLoggedOut ? 0 : (listData?.total ?? 0);
  const listQueryStale = settledListQueryKey !== listQueryKeySerialized;
  const showListSkeleton =
    !joinedTabLoggedOut && !listFailed && (listLoading || listQueryStale);

  const yourRank =
    meta?.yourRank != null && Number.isFinite(meta.yourRank) ? meta.yourRank : null;

  return (
    <>
      <PageMeta title={challengesTitle} description={challengesDescription} path={CHALLENGES_PATH} />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-10">
            <h1 className="mb-2 text-3xl font-bold text-foreground sm:mb-3 sm:text-4xl">
              Challenges
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
              Time-limited competitions: set your best lap at a specific track and car class, climb the
              leaderboard, and earn badges. Manual entries show as unverified; .ibt uploads are verified
              telemetry.
            </p>
          </div>

          <div className="border-white/3 mb-8 flex flex-wrap gap-6 border-b pb-4">
            {(
              [
                ["upcoming", "Upcoming"],
                ["live", "Live"],
                ["past", "Past"],
                ["joined", "Joined"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`relative text-sm font-medium transition-colors ${
                  tab === key
                    ? "text-foreground"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                {label}
                {tab === key && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-0.5"
                    style={{ backgroundColor: "rgb(240, 28, 28)" }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Search title or track…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="border-white/4 w-full rounded-lg border bg-card/15 py-2.5 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={simFilter}
                onChange={(e) => setSimFilter(e.target.value)}
                className="border-white/4 rounded-lg border bg-card/15 px-3 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none"
                aria-label="Simulator"
              >
                <option value="">All sims</option>
                <option value="IRACING">iRacing</option>
                <option value="F1_25">F1 25</option>
              </select>
              <input
                type="text"
                placeholder="Car class"
                value={carClassFilter}
                onChange={(e) => setCarClassFilter(e.target.value)}
                className="border-white/4 min-w-[140px] rounded-lg border bg-card/15 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>

          {joinError && (
            <div className="mb-4 text-sm text-neutral-400">{joinError}</div>
          )}

          {showListSkeleton && <ChallengeBrowseGridSkeleton count={SKELETON_COUNT} />}

          {error && !showListSkeleton && (
            <div className="flex min-h-[240px] items-center justify-center py-16">
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}

          {!showListSkeleton && !error && total === 0 && (
            <div className="flex min-h-[240px] items-center justify-center py-16">
              <p className="text-muted-foreground">
                {joinedTabLoggedOut
                  ? "Sign in to see challenges you’ve joined."
                  : debouncedQ || simFilter || carClassFilter.trim()
                    ? "No challenges match your filters."
                    : tab === "joined"
                      ? "You haven’t joined any challenges yet."
                      : "No challenges in this tab right now."}
              </p>
            </div>
          )}

          {!showListSkeleton && !error && total > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <ChallengeBrowseCard
                    key={c.id}
                    item={c}
                    isLoggedIn={Boolean(user)}
                    onJoin={handleJoin}
                    joiningId={joiningId}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-card/20 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-card/20 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                </div>
              )}
            </>
          )}

          {user && (
            <div className="border-white/3 mt-16 border-t pt-12">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                    Open challenges
                  </p>
                  <p className="text-2xl font-bold text-white">{meta?.activeChallenges ?? "—"}</p>
                  <p className="mt-1 text-xs text-white/60">Upcoming + active</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                    Your rank
                  </p>
                  <p
                    className={
                      yourRank != null ? "text-2xl font-bold" : "text-2xl font-bold text-white"
                    }
                    style={yourRank != null ? { color: "rgb(240, 28, 28)" } : undefined}
                  >
                    {yourRank != null ? `#${yourRank}` : "Unranked"}
                  </p>
                  <p className="mt-1 text-xs text-white/60">Overall wins leaderboard</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                    Joined
                  </p>
                  <p className="text-2xl font-bold text-white">{meta?.joinedThisSeason ?? "—"}</p>
                  <p className="mt-1 text-xs text-white/60">Challenge joins</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
