import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { MeResponse } from "@/auth/api";
import { clearToken } from "@/auth/token";
import {
  getProfileSummary,
  getFollowers,
  getFollowing,
  type ProfileSummary,
  type FollowUser,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileView } from "@/components/ProfileView";

const emptyBuckets = {
  Mon: 0,
  Tue: 0,
  Wed: 0,
  Thu: 0,
  Fri: 0,
  Sat: 0,
  Sun: 0,
};

/** Resolve display name for the current account (works for any account: displayName, name, or email). */
function getAccountDisplayName(user: { displayName?: string; name?: string; email?: string }): string {
  const n = (user.displayName ?? user.name)?.trim();
  if (n && n.length > 0) return n;
  const e = user.email?.trim();
  if (e && e.length > 0) return e;
  return "User";
}

function profileSummaryFromMe(me: MeResponse): ProfileSummary {
  const u = me.user;
  return {
    user: {
      id: u.id,
      displayName: getAccountDisplayName(u),
      streakDays: 0,
      tagline: undefined,
      level: undefined,
      levelProgressPct: undefined,
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

export default function Profile() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);
  const [followsError, setFollowsError] = useState<string | null>(null);
  const [openList, setOpenList] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfileSummary()
      .then(setProfile)
      .catch(() => setProfile(profileSummaryFromMe({ user })));
  }, [user]);

  useEffect(() => {
    const loadFollows = async () => {
      if (!user) return;
      try {
        setFollowsLoading(true);
        setFollowsError(null);
        const [f1, f2] = await Promise.all([
          getFollowers(user.id),
          getFollowing(user.id),
        ]);
        setFollowers(Array.isArray(f1) ? f1 : []);
        setFollowing(Array.isArray(f2) ? f2 : []);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "Failed to load followers/following.";
        setFollowsError(msg);
        setFollowers([]);
        setFollowing([]);
      } finally {
        setFollowsLoading(false);
      }
    };
    loadFollows();
  }, [user]);

  const handleSignOut = () => {
    clearToken();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center max-w-md">
          <p className="text-white/80 mb-4">Not signed in.</p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const accountName = getAccountDisplayName(user);
  const me: MeResponse = { user };
  const displayProfile: ProfileSummary = profile
    ? { ...profile, user: { ...profile.user, displayName: accountName } }
    : profileSummaryFromMe(me);

  const memberSince =
    user.createdAt &&
    (() => {
      try {
        const d = new Date(user.createdAt);
        return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
      } catch {
        return null;
      }
    })();

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <ProfileView
        profile={displayProfile}
        avatarUrl={undefined}
        followersCount={followers.length}
        followingCount={following.length}
        isCurrentUser
        onOpenFollowers={() => setOpenList("followers")}
        onOpenFollowing={() => setOpenList("following")}
      />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-end gap-2">
          {memberSince && (
            <p className="text-sm text-white/50">Member since {memberSince}</p>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            Sign out
          </button>
        </div>
      </div>
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
                      : "") || "User";
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
                        {f.avatarUrl ? (
                          <img
                            src={f.avatarUrl}
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
                      : "") || "User";
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
                        {f.avatarUrl ? (
                          <img
                            src={f.avatarUrl}
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
