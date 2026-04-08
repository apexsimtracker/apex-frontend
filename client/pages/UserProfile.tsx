import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProfileView } from "@/components/ProfileView";
import { useAuth } from "@/contexts/AuthContext";
import {
  resolveApiUrl,
  getProfileSummaryForUser,
  getProfileRaceHistoryForUser,
  RACE_HISTORY_PAGE_SIZE,
  getUserPublicProfile,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  ApiError,
  type ProfileSummary,
  type FollowUser,
} from "@/lib/api";
import { profileKeys } from "@/lib/profileQueryKeys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const {
    data: followsData,
    isPending: followsLoading,
    error: followsErrorRaw,
  } = useQuery({
    queryKey: profileKeys.userFollows(id),
    queryFn: async () => {
      const [f1, f2] = await Promise.all([getFollowers(id), getFollowing(id)]);
      return {
        followers: Array.isArray(f1) ? f1 : [],
        following: Array.isArray(f2) ? f2 : [],
      };
    },
    enabled: Boolean(id),
  });

  const followers: FollowUser[] = followsData?.followers ?? [];
  const following: FollowUser[] = followsData?.following ?? [];
  const followsError =
    followsErrorRaw instanceof Error
      ? followsErrorRaw.message
      : followsErrorRaw
        ? "Failed to load followers/following."
        : null;

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

      <Dialog
        open={openList !== null}
        onOpenChange={(open) => !open && setOpenList(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {openList === "followers" ? "Followers" : "Following"}
            </DialogTitle>
          </DialogHeader>
          {followsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : followsError ? (
            <p className="text-sm text-destructive">{followsError}</p>
          ) : openList === "followers" ? (
            followers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No followers yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {followers.map((f) => {
                  const name =
                    (typeof f.displayName === "string"
                      ? f.displayName.trim()
                      : "") || (f.email?.trim() ?? "—");
                  const initials =
                    name && name.length >= 2
                      ? name.slice(0, 2).toUpperCase()
                      : name.slice(0, 1).toUpperCase() || "?";
                  return (
                    <li
                      key={f.id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-card/40 px-3 py-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/80 overflow-hidden">
                        {resolveApiUrl(f.avatarUrl) ? (
                          <img
                            src={resolveApiUrl(f.avatarUrl)!}
                            alt={name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {name}
                        </p>
                        {f.bio && (
                          <p className="text-xs text-muted-foreground truncate">
                            {f.bio}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : openList === "following" ? (
            following.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not following anyone yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {following.map((f) => {
                  const name =
                    (typeof f.displayName === "string"
                      ? f.displayName.trim()
                      : "") || (f.email?.trim() ?? "—");
                  const initials =
                    name && name.length >= 2
                      ? name.slice(0, 2).toUpperCase()
                      : name.slice(0, 1).toUpperCase() || "?";
                  return (
                    <li
                      key={f.id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-card/40 px-3 py-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/80 overflow-hidden">
                        {resolveApiUrl(f.avatarUrl) ? (
                          <img
                            src={resolveApiUrl(f.avatarUrl)!}
                            alt={name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {name}
                        </p>
                        {f.bio && (
                          <p className="text-xs text-muted-foreground truncate">
                            {f.bio}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
