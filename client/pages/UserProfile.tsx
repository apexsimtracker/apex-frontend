import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { ProfileView } from "@/components/ProfileView";
import { useAuth } from "@/contexts/AuthContext";
import {
  resolveApiUrl,
  getProfileSummaryForUser,
  getUserPublicProfile,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  ApiError,
  type ProfileSummary,
  type FollowUser,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);
  const [followsError, setFollowsError] = useState<string | null>(null);
  const [openList, setOpenList] = useState<"followers" | "following" | null>(null);

  const [preview, setPreview] = useState<Awaited<
    ReturnType<typeof getUserPublicProfile>
  > | null>(null);

  const [followLoading, setFollowLoading] = useState(false);

  const id = userId?.trim() ?? "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    setProfile(null);
    setPreview(null);

    (async () => {
      try {
        const [summary, pub] = await Promise.all([
          getProfileSummaryForUser(id),
          getUserPublicProfile(id),
        ]);
        if (cancelled) return;
        setProfile(summary);
        setPreview(pub);
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(e instanceof Error ? e.message : "Failed to load profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || notFound || loadError) return;
    let cancelled = false;
    (async () => {
      try {
        setFollowsLoading(true);
        setFollowsError(null);
        const [f1, f2] = await Promise.all([
          getFollowers(id),
          getFollowing(id),
        ]);
        if (cancelled) return;
        setFollowers(Array.isArray(f1) ? f1 : []);
        setFollowing(Array.isArray(f2) ? f2 : []);
      } catch (e) {
        if (cancelled) return;
        setFollowsError(
          e instanceof Error ? e.message : "Failed to load followers/following."
        );
        setFollowers([]);
        setFollowing([]);
      } finally {
        if (!cancelled) setFollowsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, notFound, loadError]);

  const handleToggleFollow = useCallback(async () => {
    if (!currentUser || !id || currentUser.id === id) return;
    setFollowLoading(true);
    try {
      const isFollowing = preview?.isFollowing ?? false;
      if (isFollowing) {
        await unfollowUser(id);
      } else {
        await followUser(id);
      }
      const pub = await getUserPublicProfile(id);
      setPreview(pub);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not update follow status.");
    } finally {
      setFollowLoading(false);
    }
  }, [currentUser, id, preview?.isFollowing]);

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

  if (loadError || !profile || !preview) {
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
            <p className="text-destructive text-sm mb-4">{loadError ?? "Something went wrong."}</p>
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
