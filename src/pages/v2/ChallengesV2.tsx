import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import ChallengeFeaturedHeroV2 from "@/pages/v2/challenges/ChallengeFeaturedHeroV2";
import ChallengeBrowseRowV2 from "@/pages/v2/challenges/ChallengeBrowseRowV2";
import ChallengeBrowseListSkeletonV2 from "@/pages/v2/challenges/ChallengeBrowseListSkeletonV2";
import ChallengesSeasonStatsV2 from "@/pages/v2/challenges/ChallengesSeasonStatsV2";
import ChallengesSeasonStatsSkeletonV2 from "@/pages/v2/challenges/ChallengesSeasonStatsSkeletonV2";
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
import { MANUAL_ACTIVITY_SIMS } from "@/lib/manualActivityData";
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
  const [tab, setTab] = useState<BrowseTab | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [simFilter, setSimFilter] = useState<string>("");
  const [carClassFilter, setCarClassFilter] = useState("");

  const hasActiveFilters = Boolean(
    debouncedQ || simFilter || carClassFilter.trim(),
  );

  const { data: meta, isPending: metaLoading } = useQuery({
    queryKey: ["challenges", "meta", user?.id ?? "anon"],
    queryFn: () => getChallengesMeta(),
    staleTime: META_STALE_MS,
  });

  const isResolvingTab =
    !hasActiveFilters && tab === null && metaLoading;

  useEffect(() => {
    if (hasActiveFilters) {
      if (tab === null) setTab("upcoming");
      return;
    }
    if (tab !== null || !meta) return;
    setTab(meta.defaultTab);
  }, [hasActiveFilters, tab, meta]);

  const joinedTabLoggedOut = tab === "joined" && !user;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedQ, simFilter, carClassFilter]);

  const listParams = tab
    ? {
        page,
        pageSize: PAGE_SIZE,
        ...listParamsForTab(tab),
        ...(debouncedQ ? { q: debouncedQ } : {}),
        ...(simFilter ? { sim: simFilter } : {}),
        ...(carClassFilter.trim() ? { carClass: carClassFilter.trim() } : {}),
      }
    : null;

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
    queryFn: () => getChallengeList(listParams!),
    enabled: Boolean(listParams) && !joinedTabLoggedOut,
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
  const listQueryEnabled = Boolean(listParams) && !joinedTabLoggedOut;
  const listQueryStale = settledListQueryKey !== listQueryKeySerialized;

  const allTabsEmpty =
    tab === null && !hasActiveFilters && !metaLoading && meta?.defaultTab === null;

  const showListSkeleton =
    !joinedTabLoggedOut &&
    !listFailed &&
    !allTabsEmpty &&
    (isResolvingTab ||
      (listQueryEnabled && (listLoading || listQueryStale)));

  const yourRank =
    meta?.yourRank != null && Number.isFinite(meta.yourRank)
      ? meta.yourRank
      : null;

  const showFeatured =
    tab === "live" && page === 1 && !showListSkeleton && !error && total > 0;
  const listItems = showFeatured ? items.slice(1) : items;
  const listSectionLabel =
    tab && showFeatured && listItems.length > 0
      ? "More live challenges"
      : tab
        ? TAB_SECTION_LABEL[tab]
        : "";

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

        {user &&
          (metaLoading ? (
            <ChallengesSeasonStatsSkeletonV2 />
          ) : (
            <ChallengesSeasonStatsV2 meta={meta ?? null} yourRank={yourRank} />
          ))}

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

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-3">
          <div className="relative w-full shrink-0 lg:min-w-0 lg:flex-1">
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
          <div className="w-full shrink-0 lg:min-w-0 lg:flex-1">
            <input
              type="text"
              placeholder="Car class"
              value={carClassFilter}
              onChange={(e) => setCarClassFilter(e.target.value)}
              className={cn(CHALLENGES_FIELD_CLASS, "w-full px-3")}
            />
          </div>
          <div className="w-full shrink-0 lg:w-auto lg:min-w-[140px]">
            <V2NativeSelect
              value={simFilter}
              onChange={(e) => setSimFilter(e.target.value)}
              className="w-full"
              aria-label="Simulator"
            >
              <option value="">All sims</option>
              {MANUAL_ACTIVITY_SIMS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </V2NativeSelect>
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

        {allTabsEmpty && (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-v2-surface-container-high ring-1 ring-v2-outline-variant/20">
              <Trophy
                className="size-7 text-v2-on-surface-variant/50"
                aria-hidden
              />
            </div>
            <div className="max-w-md space-y-2">
              <p className="font-v2-headline text-base font-semibold text-v2-on-surface">
                No challenges right now
              </p>
              <p className="font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                There are no upcoming, live, past, or joined challenges at the
                moment. Check back soon — new time-limited competitions are
                added regularly.
              </p>
            </div>
          </div>
        )}

        {error && !showListSkeleton && !allTabsEmpty && (
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

        {!showListSkeleton && !error && !allTabsEmpty && total === 0 && (
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

        {!showListSkeleton && !error && !allTabsEmpty && total > 0 && (
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
