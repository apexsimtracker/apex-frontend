import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import ChallengeFeaturedHeroV2 from "@/pages/v2/challenges/ChallengeFeaturedHeroV2";
import ChallengeBrowseRowV2 from "@/pages/v2/challenges/ChallengeBrowseRowV2";
import ChallengeBrowseListSkeletonV2 from "@/pages/v2/challenges/ChallengeBrowseListSkeletonV2";
import ChallengesSeasonStatsV2 from "@/pages/v2/challenges/ChallengesSeasonStatsV2";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import V2NativeSelect from "@/components/v2/ui/V2NativeSelect";
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
import { V2_AUTH_PATHS } from "@/config/navigation";
import { cn } from "@/lib/utils";

const CHALLENGES_V2_PATH = "/v2/challenges";
const challengesTitle = `Challenges | ${COMPANY_NAME}`;
const challengesDescription = `Sim racing challenges and tournaments on ${COMPANY_NAME}: compete, qualify, and climb leaderboards.`;

const PAGE_SIZE = 12;
const SKELETON_ROW_COUNT = 5;
const META_STALE_MS = 5 * 60_000;

const TAB_CONFIG = [
  ["upcoming", "Upcoming"],
  ["live", "Live"],
  ["past", "Past"],
  ["joined", "Joined"],
] as const;

type BrowseTab = (typeof TAB_CONFIG)[number][0];

const TAB_SECTION_LABEL: Record<BrowseTab, string> = {
  upcoming: "Upcoming challenges",
  live: "Live challenges",
  past: "Past challenges",
  joined: "Joined challenges",
};

/** Community-style fields; radius stays `rounded-v2-sm`; height matches `V2NativeSelect` (`h-12`). */
const CHALLENGES_FIELD_CLASS =
  "h-12 rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container font-v2-body text-sm text-v2-on-surface transition-colors placeholder:text-v2-on-surface-variant/60 focus:border-v2-primary/40 focus:outline-none";

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
      navigate(V2_AUTH_PATHS.login, { state });
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

  const showFeatured =
    tab === "live" && page === 1 && !showListSkeleton && !error && total > 0;
  const listItems = showFeatured ? items.slice(1) : items;
  const listSectionLabel =
    showFeatured && listItems.length > 0
      ? "More live challenges"
      : TAB_SECTION_LABEL[tab];

  const paginationButtonClassName = cn(
    v2OutlineButtonClassName,
    "inline-flex items-center gap-1 px-3 py-2 font-v2-body text-sm font-medium normal-case tracking-normal",
  );

  const emptyMessage = joinedTabLoggedOut
    ? "Sign in to see challenges you've joined."
    : debouncedQ || simFilter || carClassFilter.trim()
      ? "No challenges match your filters."
      : tab === "joined"
        ? "You haven't joined any challenges yet."
        : "No challenges in this tab right now.";

  return (
    <>
      <PageMeta
        title={challengesTitle}
        description={challengesDescription}
        path={CHALLENGES_V2_PATH}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-8 px-6 py-8">
        <header>
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Challenges
          </h1>
          <p className="mt-2 max-w-3xl font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            Time-limited competitions: set your best lap at a specific track and
            car class, climb the leaderboard, and earn badges. Manual entries
            show as unverified; .ibt uploads are verified telemetry.
          </p>
        </header>

        {user && <ChallengesSeasonStatsV2 meta={meta} yourRank={yourRank} />}

        <section className="flex gap-2 overflow-x-auto pb-1">
          {TAB_CONFIG.map(([key, label]) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "shrink-0 rounded-v2-sm px-4 py-2 font-v2-body text-xs font-bold transition-colors",
                  isActive
                    ? "bg-v2-primary text-white"
                    : "bg-v2-surface-container-low text-v2-on-surface-variant hover:text-v2-on-surface",
                  isActive &&
                    key === "live" &&
                    "shadow-[0_0_20px_hsl(var(--v2-primary)/0.12)]",
                )}
              >
                {label}
              </button>
            );
          })}
        </section>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative min-w-0 flex-1">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-v2-on-surface-variant/60"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Search title or track…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn(CHALLENGES_FIELD_CLASS, "w-full pl-10 pr-4")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <V2NativeSelect
              value={simFilter}
              onChange={(e) => setSimFilter(e.target.value)}
              className="min-w-[140px]"
              aria-label="Simulator"
            >
              <option value="">All sims</option>
              <option value="IRACING">iRacing</option>
              <option value="F1_25">F1 25</option>
            </V2NativeSelect>
            <input
              type="text"
              placeholder="Car class"
              value={carClassFilter}
              onChange={(e) => setCarClassFilter(e.target.value)}
              className={cn(
                CHALLENGES_FIELD_CLASS,
                "min-w-[120px] flex-1 px-3",
              )}
            />
          </div>
        </div>

        {joinError && (
          <div className="font-v2-body text-sm text-v2-error">{joinError}</div>
        )}

        {showListSkeleton && (
          <ChallengeBrowseListSkeletonV2
            showHero={tab === "live"}
            rowCount={SKELETON_ROW_COUNT}
          />
        )}

        {error && !showListSkeleton && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12">
            <Trophy
              className="size-10 text-v2-on-surface-variant/40"
              aria-hidden
            />
            <p className="font-v2-body text-sm text-v2-on-surface-variant">
              {error}
            </p>
          </div>
        )}

        {!showListSkeleton && !error && total === 0 && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12">
            <Trophy
              className="size-10 text-v2-on-surface-variant/40"
              aria-hidden
            />
            <p className="text-center font-v2-body text-sm text-v2-on-surface-variant">
              {emptyMessage}
            </p>
          </div>
        )}

        {!showListSkeleton && !error && total > 0 && (
          <div className="space-y-8">
            {showFeatured && (
              <div className="space-y-3">
                <h2 className="font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
                  Live challenge
                </h2>
                <ChallengeFeaturedHeroV2
                  item={items[0]}
                  onJoin={handleJoin}
                  joiningId={joiningId}
                  detailTo={`/v2/challenge/${items[0].id}`}
                />
              </div>
            )}

            {listItems.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
                  {listSectionLabel}
                </h2>
                <div className="space-y-3">
                  {listItems.map((c) => (
                    <ChallengeBrowseRowV2
                      key={c.id}
                      item={c}
                      isLoggedIn={Boolean(user)}
                      onJoin={handleJoin}
                      joiningId={joiningId}
                      detailTo={`/v2/challenge/${c.id}`}
                      showStatusChip={tab !== "live"}
                    />
                  ))}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={paginationButtonClassName}
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
                  className={paginationButtonClassName}
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
