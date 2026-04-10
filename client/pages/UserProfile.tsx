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

type ProfileBundle = {
  profile: ProfileSummary;
  preview: Awaited<ReturnType<typeof getUserPublicProfile>>;
};

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

  const profileBundleQuery = useQuery({
    queryKey: profileKeys.userBundle(id),
    queryFn: async (): Promise<ProfileBundle> => {
      const [profile, preview] = await Promise.all([
        getProfileSummaryForUser(id),
        getUserPublicProfile(id),
      ]);
      return { profile, preview };
    },
    enabled: Boolean(id),
    retry: (failureCount, err) =>
      !(err instanceof ApiError && err.status === 404),
  });

  const notFound =
    profileBundleQuery.error instanceof ApiError &&
    profileBundleQuery.error.status === 404;

  const loadError =
    profileBundleQuery.isError &&
    profileBundleQuery.error &&
    !(profileBundleQuery.error instanceof ApiError && profileBundleQuery.error.status === 404)
      ? profileBundleQuery.error instanceof Error
        ? profileBundleQuery.error.message
        : "Failed to load profile."
      : null;

  // Race history + follows only need `id` from the URL; they run in parallel with the bundle.
  // Trade-off: invalid / missing users may 404 the bundle while these requests still fire.
  const { data: raceHistoryData, isPending: raceHistoryLoading } = useQuery({
    queryKey: profileKeys.userRaceHistory(id, raceHistoryPage),
    queryFn: () =>
      getProfileRaceHistoryForUser(id, {
        page: raceHistoryPage,
        limit: RACE_HISTORY_PAGE_SIZE,
      }),
    enabled: Boolean(id),
  });

  const profile = profileBundleQuery.data?.profile ?? null;
  const preview = profileBundleQuery.data?.preview ?? null;

  const loading = Boolean(id) && profileBundleQuery.isPending;

  const handleToggleFollow = useCallback(async () => {
    if (!currentUser || !id || currentUser.id === id) return;
    setFollowLoading(true);
    setFollowActionError(null);
    try {
      const isFollowing = preview?.isFollowing ?? false;
      if (isFollowing) {
        await unfollowUser(id);
      } else {
        await followUser(id);
      }
      const pub = await getUserPublicProfile(id);
      queryClient.setQueryData<ProfileBundle>(profileKeys.userBundle(id), (old) =>
        old ? { ...old, preview: pub } : old
      );
      void queryClient.invalidateQueries({
        queryKey: ["profile", "followList", id],
      });
      void queryClient.invalidateQueries({
        queryKey: profileKeys.publicPreview(id),
      });
      // Home feed is scoped to self + followed users; refetch when follow graph changes.
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
  }, [currentUser, id, preview?.isFollowing, queryClient]);

  if (!id) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-foreground text-lg">Invalid profile link.</p>
        </div>
      </div>
    );
  }

  if (!authLoading && currentUser?.id === id) {
    return <Navigate to="/profile" replace />;
  }

  if (loading || authLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="text-center">
            <p className="text-foreground text-lg">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  const combinedError = loadError || followActionError;

  if (combinedError || !profile || !preview) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="text-center max-w-md mx-auto">
            <p className="text-destructive text-sm mb-4">{combinedError ?? "Something went wrong."}</p>
            <Link
              to="/community"
              className="text-primary text-sm underline underline-offset-2"
            >
              Back to community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = resolveApiUrl(preview.avatarUrl) ?? undefined;
  const bio =
    preview.bio?.trim() ||
    (profile.user as { tagline?: string; bio?: string }).bio?.trim() ||
    (profile.user as { tagline?: string; bio?: string }).tagline?.trim() ||
    undefined;

  const displayProfile: ProfileSummary = {
    ...profile,
    user: {
      ...profile.user,
      displayName: preview.displayName || profile.user.displayName,
    },
  };

  const showFollowUi = Boolean(currentUser && currentUser.id !== id);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <ProfileView
        profile={displayProfile}
        onBack={() => navigate(-1)}
        avatarUrl={avatarUrl || undefined}
        bio={bio}
        followersCount={preview.followersCount}
        followingCount={preview.followingCount}
        isCurrentUser={false}
        isFollowing={preview.isFollowing}
        followLoading={followLoading}
        onToggleFollow={showFollowUi ? handleToggleFollow : undefined}
        onOpenFollowers={() => setOpenList("followers")}
        onOpenFollowing={() => setOpenList("following")}
        raceHistoryPagination={{
          page: raceHistoryData?.page ?? raceHistoryPage,
          limit: raceHistoryData?.limit ?? RACE_HISTORY_PAGE_SIZE,
          totalPages: raceHistoryData?.totalPages ?? 1,
          total: raceHistoryData?.total ?? 0,
          items: raceHistoryData?.items ?? [],
          loading: raceHistoryLoading,
          onPageChange: setRaceHistoryPage,
        }}
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
