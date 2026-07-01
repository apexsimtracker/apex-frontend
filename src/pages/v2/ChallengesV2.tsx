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
import { cn } from "@/lib/utils";

const CHALLENGES_V2_PATH = "/v2/challenges";
const challengesTitle = `Challenges | ${COMPANY_NAME}`;
const challengesDescription = `Sim racing challenges and tournaments on ${COMPANY_NAME}: compete, qualify, and climb leaderboards.`;

const PAGE_SIZE = 12;
const SKELETON_COUNT = 6;
const META_STALE_MS = 5 * 60_000;

const TAB_CONFIG = [
  ["upcoming", "Upcoming"],
  ["live", "Live"],
  ["past", "Past"],
  ["joined", "Joined"],
] as const;

type BrowseTab = (typeof TAB_CONFIG)[number][0];

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

const CHALLENGE_CARD_CLASS =
  "rounded-2xl border-v2-outline-variant/15 bg-v2-surface-container hover:bg-v2-surface-container-high";

export default function ChallengesV2() {
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
    [user?.id, tab, page, debouncedQ, simFilter, carClassFilter],
  );

  const listQueryKeySerialized = JSON.stringify(listQueryKey);
  const [settledListQueryKey, setSettledListQueryKey] = useState(
    listQueryKeySerialized,
  );

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
    [listData?.items],
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
      void queryClient.invalidateQueries({
        queryKey: ["challenges", "social"],
      });
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
          : "Join failed",
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

  const joiningId = joinMutation.isPending
    ? (joinMutation.variables ?? null)
    : null;

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
    meta?.yourRank != null && Number.isFinite(meta.yourRank)
      ? meta.yourRank
      : null;

  return (
    <>
      <PageMeta
        title={challengesTitle}
        description={challengesDescription}
        path={CHALLENGES_V2_PATH}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto px-4 pb-4 pt-5">
        <section className="mb-5">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Challenges
          </h1>
          <p className="mt-1 font-v2-body text-[10px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
            Compete, qualify, and climb leaderboards
          </p>
        </section>

        <section className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {TAB_CONFIG.map(([key, label]) => {
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

        <section className="mb-5 flex flex-col gap-3">
          <div className="relative min-w-0">
            <Search
              className="absolute left-3 top-3 size-4 text-v2-on-surface-variant/60"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Search title or track…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container py-2.5 pl-10 pr-4 font-v2-body text-sm text-v2-on-surface transition-colors placeholder:text-v2-on-surface-variant/60 focus:border-v2-primary/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={simFilter}
              onChange={(e) => setSimFilter(e.target.value)}
              className="rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container px-3 py-2.5 font-v2-body text-sm text-v2-on-surface focus:border-v2-primary/40 focus:outline-none"
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
              className="min-w-[120px] flex-1 rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container px-3 py-2.5 font-v2-body text-sm text-v2-on-surface placeholder:text-v2-on-surface-variant/60 focus:border-v2-primary/40 focus:outline-none"
            />
          </div>
        </section>

        {joinError && (
          <div className="mb-4 font-v2-body text-sm text-v2-error">
            {joinError}
          </div>
        )}

        {showListSkeleton && (
          <ChallengeBrowseGridSkeleton count={SKELETON_COUNT} />
        )}

        {error && !showListSkeleton && (
          <div className="flex min-h-[200px] items-center justify-center py-12">
            <p className="font-v2-body text-v2-on-surface-variant">{error}</p>
          </div>
        )}

        {!showListSkeleton && !error && total === 0 && (
          <div className="flex min-h-[200px] items-center justify-center py-12">
            <p className="text-center font-v2-body text-v2-on-surface-variant">
              {joinedTabLoggedOut
                ? "Sign in to see challenges you've joined."
                : debouncedQ || simFilter || carClassFilter.trim()
                  ? "No challenges match your filters."
                  : tab === "joined"
                    ? "You haven't joined any challenges yet."
                    : "No challenges in this tab right now."}
            </p>
          </div>
        )}

        {!showListSkeleton && !error && total > 0 && (
          <>
            <div className="grid grid-cols-1 gap-3">
              {items.map((c) => (
                <ChallengeBrowseCard
                  key={c.id}
                  item={c}
                  isLoggedIn={Boolean(user)}
                  onJoin={handleJoin}
                  joiningId={joiningId}
                  detailTo={`/v2/challenge/${c.id}`}
                  className={CHALLENGE_CARD_CLASS}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container px-3 py-2 font-v2-body text-sm font-medium text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </button>
                <span className="font-v2-body text-sm text-v2-on-surface-variant">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-v2-outline-variant/20 bg-v2-surface-container px-3 py-2 font-v2-body text-sm font-medium text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </>
        )}

        {user && (
          <section className="mt-8 rounded-2xl border border-white/5 bg-v2-surface-container p-6">
            <h2 className="mb-6 font-v2-body text-xs font-semibold uppercase tracking-wider text-v2-on-surface-variant">
              Your season stats
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center sm:text-left">
                <p className="mb-1 font-v2-body text-[10px] font-medium text-v2-on-surface-variant">
                  Active challenges
                </p>
                <p className="font-v2-headline text-2xl font-black text-v2-on-surface">
                  {meta?.activeChallenges ?? "—"}
                </p>
              </div>
              <div className="border-x border-white/5 text-center sm:text-left">
                <p className="mb-1 font-v2-body text-[10px] font-medium text-v2-on-surface-variant">
                  Overall rank
                </p>
                <p
                  className={cn(
                    "font-v2-headline text-2xl font-black",
                    yourRank != null ? "text-v2-primary" : "text-v2-on-surface",
                  )}
                >
                  {yourRank != null ? `#${yourRank}` : "Unranked"}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-1 font-v2-body text-[10px] font-medium text-v2-on-surface-variant">
                  Joined this season
                </p>
                <p className="font-v2-headline text-2xl font-black text-v2-on-surface">
                  {meta?.joinedThisSeason ?? "—"}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
