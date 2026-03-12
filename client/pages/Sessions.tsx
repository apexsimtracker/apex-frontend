import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Upload, PenLine, Cpu, Zap, X } from "lucide-react";
import ActivityCard from "@/components/ActivityCard";
import BundledActivityCard from "@/components/BundledActivityCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { getActivity, isNetworkError, type SessionsFilterType } from "@/lib/api";
import {
  groupSessions,
  getActivityKey,
  type SessionItem,
  type ActivityItem as GroupedActivityItem,
} from "@/lib/groupSessions";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";

const ONBOARDED_KEY = "apex_onboarded";

function setOnboarded() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ONBOARDED_KEY, "true");
  }
}

type RawActivityItem = SessionItem & { type?: "session" };

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop";

function timeAgo(createdAt: string | Date): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

function SessionCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/6 bg-card/20 overflow-hidden mb-6">
      <div className="px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3">
        <SkeletonBlock height={36} width={36} rounded="full" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <SkeletonBlock height={14} width={80} />
          <SkeletonBlock height={12} width={56} />
        </div>
      </div>
      <div className="px-4 sm:px-5 pt-1.5 pb-4 sm:pb-5">
        <SkeletonBlock height={12} width={64} className="mb-2" />
        <SkeletonBlock height={20} width="75%" className="mb-3" />
        <SkeletonBlock height={14} width={112} className="mb-4" />
        <div className="flex gap-4">
          <SkeletonBlock height={64} className="flex-1" rounded="lg" />
          <SkeletonBlock height={64} className="flex-1" rounded="lg" />
        </div>
      </div>
      <div className="px-4 sm:px-5 py-2.5 flex items-center gap-4 border-t border-white/5">
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
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link to="/manual">
            <PenLine className="h-4 w-4 mr-2" />
            Log Manual Activity
          </Link>
        </Button>
        <Button variant="outline" asChild className="border-white/10 text-white/80 hover:bg-white/10">
          <Link to="/upload">
            <Upload className="h-4 w-4 mr-2" />
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
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link to="/upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Session
          </Link>
        </Button>
        {isPro ? (
          <Button variant="outline" asChild className="border-white/10 text-white/80 hover:bg-white/10">
            <Link to="/agent">
              <Cpu className="h-4 w-4 mr-2" />
              Get the Agent
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild className="border-amber-500/30 text-amber-400/90 hover:bg-amber-500/10">
            <Link to="/upgrade">
              <Zap className="h-4 w-4 mr-2" />
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
  const { user } = useAuth();
  const isPro = useIsProUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionsType = (searchParams.get("sessionsType") as SessionsFilterType) || "all";
  const validType = TAB_VALUES.some((t) => t.value === sessionsType) ? sessionsType : "all";

  const [activity, setActivity] = useState<RawActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

  const loadSessions = useCallback((type: SessionsFilterType) => {
    setLoading(true);
    setError(null);
    getActivity(type)
      .then((list) => {
        setActivity((list as RawActivityItem[]) ?? []);
      })
      .catch((err) => {
        if (isNetworkError(err)) {
          setError("Can't reach Apex backend. Check it's running.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load sessions.");
        }
        setActivity([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSessions(validType);
  }, [validType, loadSessions]);

  useEffect(() => {
    function handleActivityUpdated() {
      loadSessions(validType);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("apex:activity-updated", handleActivityUpdated);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("apex:activity-updated", handleActivityUpdated);
      }
    };
  }, [validType, loadSessions]);

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

  const groupedActivity = useMemo<GroupedActivityItem[]>(() => {
    return groupSessions(activity);
  }, [activity]);

  const isEmpty = !loading && groupedActivity.length === 0;
  const showEmptyManual = isEmpty && validType === "manual";
  const showEmptyTelemetry = isEmpty && validType === "telemetry";

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {showOnboardingBanner && (
          <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5 relative">
            <button
              type="button"
              onClick={dismissOnboarding}
              className="absolute right-3 top-3 p-1 text-white/50 hover:text-white rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-semibold text-white pr-8">
              Welcome to Apex
            </h2>
            <p className="mt-1 text-sm text-white/60">
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
                className="bg-white text-black hover:bg-white/90 text-sm"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Upload Session
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOnboarded();
                  setShowOnboardingBanner(false);
                  navigate("/manual");
                }}
                className="border-white/20 text-white/80 hover:bg-white/10 text-sm"
              >
                <PenLine className="h-4 w-4 mr-1.5" />
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
                  className="border-white/20 text-white/80 hover:bg-white/10 text-sm"
                >
                  <Cpu className="h-4 w-4 mr-1.5" />
                  Set up Apex Agent
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setOnboarded();
                    setShowOnboardingBanner(false);
                    navigate("/upgrade");
                  }}
                  className="border-amber-500/30 text-amber-400/90 hover:bg-amber-500/10 text-sm"
                >
                  <Zap className="h-4 w-4 mr-1.5" />
                  See Apex Pro
                </Button>
              )}
            </div>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-semibold text-white mb-6">
          Sessions
        </h1>

        <Tabs
          value={validType}
          onValueChange={setTab}
          className="w-full"
        >
          <TabsList className="bg-white/5 border border-white/10 rounded-lg p-0.5 h-auto">
            {TAB_VALUES.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-md px-4 py-2 text-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
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
                  <p className="text-red-400/90 text-sm">{error}</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-white/20 text-white/80"
                    onClick={() => loadSessions(validType)}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {!loading && !error && showEmptyManual && <EmptyManual />}
              {!loading && !error && showEmptyTelemetry && <EmptyTelemetry />}

              {!loading && !error && !isEmpty && (
                <div className="space-y-0">
                  {groupedActivity.map((item) => {
                    if (item.type === "bundle") {
                      return (
                        <BundledActivityCard
                          key={getActivityKey(item)}
                          sessions={item.sessions}
                          overflowCount={item.overflowCount}
                          onSessionPatch={(id, patch) => {
                            setActivity((prev) =>
                              prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
                            );
                          }}
                        />
                      );
                    }
                    const session = item.session;
                    return (
                      <Link
                        key={getActivityKey(item)}
                        to={`/sessions/${session.id}`}
                        className="block"
                      >
                        <ActivityCard
                          id={session.id}
                          userName={session.driverName}
                          userAvatar={DEFAULT_AVATAR}
                          game="—"
                          car={session.car ?? "—"}
                          vehicleDisplay={session.vehicleDisplay}
                          track={session.track ?? "—"}
                          position={session.position ?? null}
                          totalRacers={session.totalDrivers ?? null}
                          sessionType={session.sessionType}
                          sim={session.sim}
                          source={session.source}
                          bestLapMs={session.bestLapMs}
                          lapCount={session.lapCount}
                          consistencyScore={session.consistencyScore}
                          likeCount={session.likeCount ?? 0}
                          commentCount={session.commentCount ?? 0}
                          likedByMe={session.likedByMe ?? false}
                          score={0}
                          timestamp={timeAgo(session.createdAt)}
                          likes={session.likeCount ?? 0}
                          comments={session.commentCount ?? 0}
                          onSessionPatch={(id, patch) => {
                            setActivity((prev) =>
                              prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
                            );
                          }}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
