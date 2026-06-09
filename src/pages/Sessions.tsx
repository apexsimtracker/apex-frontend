import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { Upload, PenLine, Cpu, X } from "lucide-react";
import { ProUpgradeCallout } from "@/components/marketing/ProUpgradeCallout";
import { BRAND_RED } from "@/lib/appConfig";
import ActivityFeedList from "@/components/ActivityFeedList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  getActivityFeedPage,
  ACTIVITY_FEED_DEFAULT_LIMIT,
  isNetworkError,
  type ActivityFeedPageResult,
  type SessionsFilterType,
} from "@/lib/api";
import { patchActivityFeedInfiniteData } from "@/lib/activityFeedCache";
import type { SessionItem } from "@/lib/groupSessions";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";

const ONBOARDED_KEY = "apex_onboarded";

const SESSIONS_PATH = "/sessions";
const sessionsTitle = `Sessions | ${COMPANY_NAME}`;
const sessionsDescription = `Browse your sim racing sessions and telemetry on ${COMPANY_NAME}.`;

function setOnboarded() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ONBOARDED_KEY, "true");
  }
}

type RawActivityItem = SessionItem & { type?: "session" };

function SessionCardSkeleton() {
  return (
    <div className="border-white/6 mb-6 overflow-hidden rounded-lg border bg-card/20">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
        <SkeletonBlock height={36} width={36} rounded="full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <SkeletonBlock height={14} width={80} />
          <SkeletonBlock height={12} width={56} />
        </div>
      </div>
      <div className="px-4 pb-4 pt-1.5 sm:px-5 sm:pb-5">
        <SkeletonBlock height={12} width={64} className="mb-2" />
        <SkeletonBlock height={20} width="75%" className="mb-3" />
        <SkeletonBlock height={14} width={112} className="mb-4" />
        <div className="flex gap-4">
          <SkeletonBlock height={64} className="flex-1" rounded="lg" />
          <SkeletonBlock height={64} className="flex-1" rounded="lg" />
        </div>
      </div>
      <div className="flex items-center gap-4 border-t border-white/5 px-4 py-2.5 sm:px-5">
        <SkeletonBlock height={14} width={48} />
        <SkeletonBlock height={14} width={56} />
      </div>
    </div>
  );
}

function SessionsListSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}

function EmptyManual() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
      <p className="text-white/70">No manual activities yet.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link to="/manual">
            <PenLine className="mr-2 size-4" />
            Log Manual Activity
          </Link>
        </Button>
        <Button variant="outline" asChild className="border-white/10 text-white/80 hover:bg-white/10">
          <Link to="/upload">
            <Upload className="mr-2 size-4" />
            Upload Session
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyTelemetry() {
  const isPro = useIsProUser();
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
      <p className="text-white/70">No telemetry sessions yet.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link to="/upload">
            <Upload className="mr-2 size-4" />
            Upload Session
          </Link>
        </Button>
        {isPro ? (
          <Button variant="outline" asChild className="border-white/10 text-white/80 hover:bg-white/10">
            <Link to="/agent">
              <Cpu className="mr-2 size-4" />
              Get the Agent
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="border-white/15 text-foreground hover:bg-muted/30"
            style={{ color: BRAND_RED }}
          >
            <Link to="/pricing">
              Upgrade for Agent
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

const TAB_VALUES: { value: SessionsFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "telemetry", label: "Telemetry" },
  { value: "manual", label: "Manual" },
];

export default function Sessions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPro = useIsProUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionsType = (searchParams.get("sessionsType") as SessionsFilterType) || "all";
  const validType = TAB_VALUES.some((t) => t.value === sessionsType) ? sessionsType : "all";

  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

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
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const activity = useMemo(
    () =>
      (activityPages?.pages.flatMap((p) => p.items) ?? []) as RawActivityItem[],
    [activityPages]
  );

  const error = useMemo(() => {
    if (!activityError) return null;
    return isNetworkError(activityError)
      ? "Can't reach Apex backend. Check it's running."
      : activityError instanceof Error
        ? activityError.message
        : "Failed to load sessions.";
  }, [activityError]);

  useEffect(() => {
    if (
      user &&
      !loading &&
      validType === "all" &&
      activity.length === 0 &&
      typeof localStorage !== "undefined" &&
      !localStorage.getItem(ONBOARDED_KEY)
    ) {
      setShowOnboardingBanner(true);
    }
  }, [user, loading, validType, activity.length]);

  const dismissOnboarding = useCallback(() => {
    setOnboarded();
    setShowOnboardingBanner(false);
  }, []);

  const setTab = useCallback(
    (value: string) => {
      const next = value as SessionsFilterType;
      setSearchParams({ sessionsType: next }, { replace: true });
    },
    [setSearchParams]
  );

  const isEmpty = !loading && activity.length === 0;
  const showEmptyManual = isEmpty && validType === "manual";
  const showEmptyTelemetry = isEmpty && validType === "telemetry";

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={sessionsTitle}
        description={sessionsDescription}
        path={SESSIONS_PATH}
        noindex
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {user && !isPro && (
          <ProUpgradeCallout
            className="mb-6"
            layout="banner"
            description="Free plan includes the last 3 months of session history. Upgrade to Apex Pro for unlimited history and analytics."
            ctaLabel="View Pro plans"
          />
        )}
        {showOnboardingBanner && (
          <div className="relative mb-6 rounded-xl border border-white/10 bg-card/50 p-4 sm:p-5">
            <button
              type="button"
              onClick={dismissOnboarding}
              className="absolute right-3 top-3 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
            <h2 className="pr-8 text-base font-semibold text-foreground">
              Welcome to Apex
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your sim racing performance automatically or log sessions
              manually.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setOnboarded();
                  setShowOnboardingBanner(false);
                  navigate("/upload");
                }}
                className="bg-white text-sm text-black hover:bg-white/90"
              >
                <Upload className="mr-1.5 size-4" />
                Upload Session
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOnboarded();
                  setShowOnboardingBanner(false);
                  navigate("/manual");
                }}
                className="border-white/20 text-sm text-white/80 hover:bg-white/10"
              >
                <PenLine className="mr-1.5 size-4" />
                Log Manual Activity
              </Button>
              {isPro ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setOnboarded();
                    setShowOnboardingBanner(false);
                    navigate("/agent");
                  }}
                  className="border-white/20 text-sm text-white/80 hover:bg-white/10"
                >
                  <Cpu className="mr-1.5 size-4" />
                  Set up Apex Agent
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setOnboarded();
                    setShowOnboardingBanner(false);
                    navigate("/pricing");
                  }}
                  className="border-white/15 text-sm text-foreground hover:bg-muted/30"
                >
                  See Apex Pro
                </Button>
              )}
            </div>
          </div>
        )}

        <h1 className="mb-6 text-xl font-semibold text-foreground sm:text-2xl">
          Sessions
        </h1>

        <Tabs
          value={validType}
          onValueChange={setTab}
          className="w-full"
        >
          <TabsList className="h-auto rounded-lg border border-white/10 bg-white/5 p-0.5">
            {TAB_VALUES.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-md px-4 py-2 text-sm text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={validType} className="mt-6">
            <div className="min-h-[280px]">
              {loading && <SessionsListSkeleton />}

              {!loading && error && (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
                  <p className="text-sm text-red-400/90">{error}</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-white/20 text-white/80"
                    onClick={() => void refetchSessions()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {!loading && !error && showEmptyManual && <EmptyManual />}
              {!loading && !error && showEmptyTelemetry && <EmptyTelemetry />}

              {!loading && !error && !isEmpty && (
                <div className="space-y-0">
                  <ActivityFeedList
                    sessions={activity as RawActivityItem[]}
                    linkCards
                    currentUser={user ?? null}
                    onSessionPatch={(id, patch) => {
                      queryClient.setQueryData<InfiniteData<ActivityFeedPageResult>>(
                        ["activity", "feed", validType, ACTIVITY_FEED_DEFAULT_LIMIT],
                        (prev) =>
                          patchActivityFeedInfiniteData(prev, id, patch as Record<string, unknown>)
                      );
                    }}
                  />
                  {hasNextPage && (
                    <div className="flex justify-center py-6">
                      <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-50"
                      >
                        {isFetchingNextPage ? "Loading…" : "Load more"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
