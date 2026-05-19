import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProfileView } from "@/components/ProfileView";
import { FollowListDialog } from "@/components/FollowListDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  resolveApiUrl,
  getProfileSummaryForUser,
  getProfileRaceHistoryForUser,
  RACE_HISTORY_PAGE_SIZE,
  getUserPublicProfile,
  followUser,
  unfollowUser,
  ApiError,
  type ProfileSummary,
} from "@/lib/api";
import { profileKeys } from "@/lib/profileQueryKeys";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";

function emptyProfileSummary(id: string, displayName: string): ProfileSummary {
  const emptyBuckets = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };
  return {
    user: {
      id,
      displayName,
      streakDays: 0,
    },
    totals: {
      races: 0,
      wins: null,
      podiums: null,
      poles: null,
      fastestLaps: 0,
      avgFinish: null,
    },
    weekly: {
      buckets: emptyBuckets,
      totalRaces: 0,
      wins: null,
      avgFinish: null,
      totalKm: null,
    },
    mostPlayed: [],
    raceHistory: [],
    statsByGame: [],
    insight: null,
  };
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, loading: authLoading } = useAuth();

  const id = userId?.trim() ?? "";

  const [raceHistoryPage, setRaceHistoryPage] = useState(1);
  const [openList, setOpenList] = useState<"followers" | "following" | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [followActionError, setFollowActionError] = useState<string | null>(null);

  useEffect(() => {
    setRaceHistoryPage(1);
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const previewQuery = useQuery({
    queryKey: profileKeys.publicPreview(id),
    queryFn: () => getUserPublicProfile(id),
    enabled: Boolean(id),
    retry: (failureCount, err) =>
      !(err instanceof ApiError && err.status === 404),
  });

  const preview = previewQuery.data ?? null;
  const viewerHasAccess = preview?.viewerHasAccess ?? false;

  const summaryQuery = useQuery({
    queryKey: ["userProfile", "summary", id],
    queryFn: () => getProfileSummaryForUser(id),
    enabled: Boolean(id) && viewerHasAccess,
    retry: (failureCount, err) =>
      !(err instanceof ApiError && (err.status === 404 || err.status === 403)),
  });

  const {
    data: raceHistoryData,
    isPending: raceHistoryLoading,
    error: raceHistoryError,
  } = useQuery({
    queryKey: profileKeys.userRaceHistory(id, raceHistoryPage),
    queryFn: () =>
      getProfileRaceHistoryForUser(id, {
        page: raceHistoryPage,
        limit: RACE_HISTORY_PAGE_SIZE,
      }),
    enabled: Boolean(id) && viewerHasAccess,
    retry: (failureCount, err) =>
      !(err instanceof ApiError && (err.status === 404 || err.status === 403)),
  });

  const raceHistoryForbiddenCode =
    viewerHasAccess &&
    raceHistoryError instanceof ApiError &&
    raceHistoryError.status === 403
      ? raceHistoryError.code
      : undefined;

  const notFound =
    previewQuery.error instanceof ApiError && previewQuery.error.status === 404;

  const loadError =
    previewQuery.isError &&
    previewQuery.error &&
    !(previewQuery.error instanceof ApiError && previewQuery.error.status === 404)
      ? previewQuery.error instanceof Error
        ? previewQuery.error.message
        : "Failed to load profile."
      : null;

  const loading = Boolean(id) && previewQuery.isPending;

  const handleToggleFollow = useCallback(async () => {
    if (!currentUser || !id || currentUser.id === id) return;
    setFollowLoading(true);
    setFollowActionError(null);
    try {
      const isFollowing = preview?.isFollowing ?? false;
      const pending = preview?.followRelationship === "pending";
      if (isFollowing || pending) {
        await unfollowUser(id);
      } else {
        await followUser(id);
      }
      const pub = await getUserPublicProfile(id);
      queryClient.setQueryData(profileKeys.publicPreview(id), pub);
      void queryClient.invalidateQueries({
        queryKey: ["profile", "followList", id],
      });
      void queryClient.invalidateQueries({
        queryKey: profileKeys.publicPreview(id),
      });
      void queryClient.invalidateQueries({
        queryKey: ["userProfile", "summary", id],
      });
      void queryClient.invalidateQueries({
        queryKey: profileKeys.userRaceHistory(id, raceHistoryPage),
      });
      void queryClient.invalidateQueries({
        queryKey: ["activity", "feed", "home"],
      });
    } catch (e) {
      setFollowActionError(
        e instanceof Error ? e.message : "Could not update follow status."
      );
    } finally {
      setFollowLoading(false);
    }
  }, [currentUser, id, preview?.isFollowing, preview?.followRelationship, queryClient, raceHistoryPage]);

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Profile | ${COMPANY_NAME}`}
          description={`${COMPANY_NAME} driver profiles and race history.`}
          path="/"
          noindex
        />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-lg text-foreground">Invalid profile link.</p>
        </div>
      </div>
    );
  }

  if (!authLoading && currentUser?.id === id) {
    return <Navigate to="/profile" replace />;
  }

  if (loading || authLoading) {
    return (
      <>
        <PageMeta
          title={`Profile | ${COMPANY_NAME}`}
          description={`${COMPANY_NAME} driver profile on ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`}
          path={`/user/${id}`}
        />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <p className="text-white/60">Loading...</p>
        </div>
      </>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`User not found | ${COMPANY_NAME}`}
          description="This profile does not exist or was removed."
          path={`/user/${id}`}
          setCanonical={false}
          noindex
        />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="text-center">
            <p className="text-lg text-foreground">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  const combinedError = loadError || followActionError;

  if (combinedError || !preview) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Profile | ${COMPANY_NAME}`}
          description={combinedError ?? "Could not load profile."}
          path={`/user/${id}`}
          noindex
        />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="mx-auto max-w-md text-center">
            <p className="mb-4 text-sm text-destructive">{combinedError ?? "Something went wrong."}</p>
            <Link
              to="/community"
              className="text-sm text-primary underline underline-offset-2"
            >
              Back to community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profileLocked = !viewerHasAccess;
  const profileData: ProfileSummary =
    viewerHasAccess && summaryQuery.data
      ? summaryQuery.data
      : emptyProfileSummary(
          id,
          preview.displayName?.trim() || "Driver"
        );

  const avatarUrl = resolveApiUrl(preview.avatarUrl) ?? undefined;
  const bio =
    preview.bio?.trim() ||
    (profileData.user as { tagline?: string; bio?: string }).bio?.trim() ||
    (profileData.user as { tagline?: string; bio?: string }).tagline?.trim() ||
    undefined;

  const displayProfile: ProfileSummary = {
    ...profileData,
    user: {
      ...profileData.user,
      displayName: preview.displayName || profileData.user.displayName,
    },
  };

  const showFollowUi = Boolean(currentUser && currentUser.id !== id);

  const displayName =
    preview.displayName?.trim() || profileData.user.displayName?.trim() || "Driver";
  const userSeoDescription = (() => {
    const t = bio?.trim() ?? "";
    if (t.length > 0) {
      return `${t.slice(0, 160)}${t.length > 160 ? "…" : ""}`;
    }
    return `${displayName} on ${COMPANY_NAME} — stats, race history, and community.`;
  })();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageMeta
        title={`${displayName} | ${COMPANY_NAME}`}
        description={userSeoDescription}
        path={`/user/${id}`}
        image={avatarUrl}
      />
      <ProfileView
        profile={displayProfile}
        onBack={() => navigate(-1)}
        avatarUrl={avatarUrl || undefined}
        bio={bio}
        followersCount={preview.followersCount}
        followingCount={preview.followingCount}
        isCurrentUser={false}
        isFollowing={preview.isFollowing}
        profileLocked={profileLocked}
        followRelationship={preview.followRelationship}
        targetPrivateProfile={preview.privateProfile}
        followLoading={followLoading}
        onToggleFollow={showFollowUi ? handleToggleFollow : undefined}
        onOpenFollowers={
          viewerHasAccess ? () => setOpenList("followers") : undefined
        }
        onOpenFollowing={
          viewerHasAccess ? () => setOpenList("following") : undefined
        }
        raceHistoryPagination={
          viewerHasAccess
            ? {
                page: raceHistoryData?.page ?? raceHistoryPage,
                limit: raceHistoryData?.limit ?? RACE_HISTORY_PAGE_SIZE,
                totalPages: raceHistoryData?.totalPages ?? 1,
                total: raceHistoryData?.total ?? 0,
                items: raceHistoryData?.items ?? [],
                loading: raceHistoryLoading,
                onPageChange: setRaceHistoryPage,
              }
            : undefined
        }
        raceHistoryForbiddenCode={raceHistoryForbiddenCode}
        isPro={preview.isPro}
        challengeBadges={preview.challengeBadges}
      />

      <FollowListDialog
        key={`${id}-${openList ?? "closed"}`}
        open={openList !== null}
        onOpenChange={(open) => !open && setOpenList(null)}
        userId={id}
        listKind={openList}
      />
    </div>
  );
}
