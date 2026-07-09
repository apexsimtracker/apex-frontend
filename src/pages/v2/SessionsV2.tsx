import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { Upload, PenLine, Cpu } from "lucide-react";
import { ProUpgradeCallout } from "@/components/marketing/ProUpgradeCallout";
import ActivityFeedListV2 from "@/components/v2/dashboard/ActivityFeedListV2";
import OnboardingEmptyStateV2 from "@/components/v2/dashboard/OnboardingEmptyStateV2";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  getActivityFeedPage,
  ACTIVITY_FEED_DEFAULT_LIMIT,
  isNetworkError,
  type ActivityFeedPageResult,
  type ActivityFeedItem,
  type SessionsFilterType,
} from "@/lib/api";
import { patchActivityFeedInfiniteData } from "@/lib/activityFeedCache";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";

const SESSIONS_V2_PATH = "/v2/sessions";
const sessionsTitle = `Sessions | ${COMPANY_NAME}`;
const sessionsDescription = `Browse your sim racing sessions and telemetry on ${COMPANY_NAME}.`;

const TAB_VALUES: { value: SessionsFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "telemetry", label: "Telemetry" },
  { value: "manual", label: "Manual" },
];

function FeedSkeletonCardV2() {
  const blockClassName = "bg-v2-surface-container-high/80";
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container-low shadow-sm">
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBlock
              height={36}
              width={36}
              rounded="full"
              className={blockClassName}
            />
            <div className="space-y-2">
              <SkeletonBlock
                height={12}
                width={96}
                className={blockClassName}
                rounded="sm"
              />
              <SkeletonBlock
                height={10}
                width={52}
                className={blockClassName}
                rounded="sm"
              />
            </div>
          </div>
          <SkeletonBlock
            height={28}
            width={56}
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-2">
            <SkeletonBlock
              height={16}
              width={40}
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={16}
              width={44}
              className={blockClassName}
              rounded="sm"
            />
          </div>
          <SkeletonBlock
            height={10}
            width={80}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={28}
            width="72%"
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="space-y-2 border-t border-v2-outline-variant/10 pt-4">
          <SkeletonBlock
            height={10}
            width={48}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={32}
            width={112}
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-v2-outline-variant/10 pt-4">
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock
                height={9}
                width={40}
                className={blockClassName}
                rounded="sm"
              />
              <SkeletonBlock
                height={14}
                width="80%"
                className={blockClassName}
                rounded="sm"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-v2-outline-variant/10 pt-3">
          <div className="flex gap-5">
            <SkeletonBlock
              height={18}
              width={44}
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={18}
              width={36}
              className={blockClassName}
              rounded="sm"
            />
          </div>
          <SkeletonBlock
            height={18}
            width={18}
            className={blockClassName}
            rounded="sm"
          />
        </div>
      </div>
    </div>
  );
}

function SessionsListSkeletonV2() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <FeedSkeletonCardV2 key={i} />
      ))}
    </div>
  );
}

function EmptyManualV2() {
  return (
    <div className="rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-8 text-center">
      <p className="font-v2-body text-sm text-v2-on-surface-variant">
        No manual activities yet.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/v2/manual"
          className={`${v2PrimaryButtonClassName} inline-flex h-11 items-center justify-center px-6`}
        >
          <PenLine className="mr-2 size-4" />
          Log Manual Activity
        </Link>
        <Link
          to="/v2/upload"
          className={`${v2OutlineButtonClassName} inline-flex h-11 items-center justify-center px-6`}
        >
          <Upload className="mr-2 size-4" />
          Upload Session
        </Link>
      </div>
    </div>
  );
}

function EmptyTelemetryV2() {
  const isPro = useIsProUser();
  return (
    <div className="rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-8 text-center">
      <p className="font-v2-body text-sm text-v2-on-surface-variant">
        No telemetry sessions yet.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/v2/upload"
          className={`${v2PrimaryButtonClassName} inline-flex h-11 items-center justify-center px-6`}
        >
          <Upload className="mr-2 size-4" />
          Upload Session
        </Link>
        {isPro ? (
          <Link
            to="/v2/agent"
            className={`${v2OutlineButtonClassName} inline-flex h-11 items-center justify-center px-6`}
          >
            <Cpu className="mr-2 size-4" />
            Get the Agent
          </Link>
        ) : (
          <Link
            to="/pricing"
            className={`${v2OutlineButtonClassName} inline-flex h-11 items-center justify-center px-6 text-v2-primary`}
          >
            Upgrade for Agent
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SessionsV2() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPro = useIsProUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionsType =
    (searchParams.get("sessionsType") as SessionsFilterType) || "all";
  const validType = TAB_VALUES.some((t) => t.value === sessionsType)
    ? sessionsType
    : "all";

  const {
    data: activityPages,
    isLoading: loading,
    error: activityError,
    refetch: refetchSessions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["activity", "feed", validType, ACTIVITY_FEED_DEFAULT_LIMIT],
    queryFn: ({ pageParam }) =>
      getActivityFeedPage({
        type: validType,
        page: pageParam as number,
        limit: ACTIVITY_FEED_DEFAULT_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  const activity = useMemo(
    () =>
      (activityPages?.pages.flatMap((p) => p.items) ??
        []) as ActivityFeedItem[],
    [activityPages],
  );

  const error = useMemo(() => {
    if (!activityError) return null;
    return isNetworkError(activityError)
      ? "Can't reach Apex backend. Check it's running."
      : activityError instanceof Error
        ? activityError.message
        : "Failed to load sessions.";
  }, [activityError]);

  const setTab = useCallback(
    (value: SessionsFilterType) => {
      setSearchParams({ sessionsType: value }, { replace: true });
    },
    [setSearchParams],
  );

  const isEmpty = !loading && activity.length === 0;
  const showEmptyManual = isEmpty && validType === "manual";
  const showEmptyTelemetry = isEmpty && validType === "telemetry";
  const showEmptyAll = isEmpty && validType === "all" && !error;

  return (
    <>
      <PageMeta
        title={sessionsTitle}
        description={sessionsDescription}
        path={SESSIONS_V2_PATH}
        noindex
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8">
        {user && !isPro && (
          <ProUpgradeCallout
            className="mb-6"
            layout="banner"
            description="Free plan includes the last 3 months of session history. Upgrade to Apex Pro for unlimited history and analytics."
            ctaLabel="View Pro plans"
          />
        )}

        <section className="mb-6">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Sessions
          </h1>
          <p className="mt-1 font-v2-body text-sm text-v2-on-surface-variant">
            Your sim racing sessions and telemetry
          </p>
        </section>

        <div
          className="mb-6 inline-flex w-full rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-1"
          role="tablist"
          aria-label="Session type"
        >
          {TAB_VALUES.map((tab) => {
            const isActive = validType === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(tab.value)}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-md p-2 font-v2-headline text-xs transition-colors sm:px-3 sm:text-sm",
                  isActive
                    ? "bg-v2-primary font-bold text-white shadow-sm"
                    : "font-medium text-v2-on-surface-variant hover:text-v2-on-surface",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-[280px]" role="tabpanel">
          {loading && <SessionsListSkeletonV2 />}

          {!loading && error && (
            <div className="rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-6 text-center">
              <p className="font-v2-body text-sm text-v2-error">{error}</p>
              <button
                type="button"
                onClick={() => void refetchSessions()}
                className={`${v2OutlineButtonClassName} mt-4 px-6 py-2`}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && showEmptyAll && <OnboardingEmptyStateV2 />}

          {!loading && !error && showEmptyManual && <EmptyManualV2 />}
          {!loading && !error && showEmptyTelemetry && <EmptyTelemetryV2 />}

          {!loading && !error && !isEmpty && (
            <div className="space-y-4">
              <ActivityFeedListV2
                items={activity}
                currentUser={user ?? null}
                onSessionPatch={(id, patch) => {
                  queryClient.setQueryData<
                    InfiniteData<ActivityFeedPageResult>
                  >(
                    [
                      "activity",
                      "feed",
                      validType,
                      ACTIVITY_FEED_DEFAULT_LIMIT,
                    ],
                    (prev) =>
                      patchActivityFeedInfiniteData(
                        prev,
                        id,
                        patch as Record<string, unknown>,
                      ),
                  );
                }}
              />
              {hasNextPage && (
                <div className="flex justify-center py-6">
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container px-4 py-2 font-v2-body text-sm text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
