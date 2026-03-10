import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { MeResponse } from "@/auth/api";
import { clearToken } from "@/auth/token";
import {
  getFollowers,
  getFollowing,
  updateMe,
  type ProfileSummary,
  type FollowUser,
  type AuthUser,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

type EditForm = {
  displayName: string;
  tagline: string;
};

const emptyEditForm: EditForm = {
  displayName: "",
  tagline: "",
};

export default function Profile() {
  const { user, loading, refreshMe, setUser } = useAuth();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);
  const [followsError, setFollowsError] = useState<string | null>(null);
  const [openList, setOpenList] = useState<"followers" | "following" | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const openEditProfile = useCallback(() => {
    if (!user) return;
    const name = getAccountDisplayName(user);
    const currentBio =
      (profile?.user as { tagline?: string; bio?: string })?.bio?.trim() ??
      (profile?.user as { tagline?: string; bio?: string })?.tagline?.trim() ??
      "";
    setEditForm({
      displayName: name,
      tagline: currentBio,
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
    setEditError(null);
    setEditSuccess(false);
    setEditOpen(true);
  }, [user, profile?.user]);

  const handleAvatarFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAvatarError(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setAvatarFile(null);
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Please choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError("Image must be 2 MB or smaller.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, [avatarPreview]);

  const clearAvatarSelection = useCallback(() => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }, [avatarPreview]);

  useEffect(() => {
    if (!user) return;
    // Build a summary view purely from the current auth user; no extra profile endpoint required.
    setProfile(profileSummaryFromMe({ user }));
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

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmedName = editForm.displayName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      setEditError("Display name must be between 2 and 40 characters.");
      return;
    }
    if (avatarError) return;
    setEditLoading(true);
    setEditError(null);
    try {
      if (import.meta.env.DEV) {
        console.log("[Profile] form state before submit:", {
          displayName: editForm.displayName,
          bio: editForm.tagline,
        });
      }
      const bioValue = editForm.tagline.trim() || undefined;
      const payload = {
        displayName: trimmedName,
        tagline: bioValue,
        bio: bioValue,
      };
      if (import.meta.env.DEV) {
        console.log("[Profile] updateMe request payload:", payload);
      }

      const updated = await updateMe(payload);
      if (import.meta.env.DEV) {
        console.log("[Profile] updateMe response (updated user):", updated);
      }

      const u = updated as { tagline?: string; bio?: string };
      const savedBio =
        (u.bio?.trim() ?? u.tagline?.trim() ?? editForm.tagline.trim()) || undefined;

      setUser(updated);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                displayName: updated.displayName ?? trimmedName,
                tagline: savedBio,
                bio: savedBio,
              },
            }
          : null
      );
      await refreshMe();
      if (import.meta.env.DEV) {
        console.log("[Profile] user after refreshMe (from authMe):", user);
      }

      getProfileSummary()
        .then((fresh) => {
          const u = fresh.user as { tagline?: string; bio?: string };
          const serverBio = u?.tagline?.trim() ?? u?.bio?.trim();
          setProfile({
            ...fresh,
            user: {
              ...fresh.user,
              tagline: serverBio ?? savedBio ?? fresh.user.tagline,
              bio: serverBio ?? savedBio ?? u?.bio,
            },
          });
          if (import.meta.env.DEV) {
            console.log("[Profile] Profile data after refetch:", fresh);
          }
        })
        .catch(() => {
          // Keep the profile we already set from updated
        });

      setEditSuccess(true);
      clearAvatarSelection();
      setTimeout(() => {
        setEditOpen(false);
        setEditSuccess(false);
      }, 800);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setEditLoading(false);
    }
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

  const avatarUrl = (user as AuthUser).avatarUrl ?? undefined;
  const bioForDisplay =
    (user as AuthUser).bio?.trim() ??
    (user as AuthUser).tagline?.trim() ??
    (displayProfile.user as { bio?: string; tagline?: string }).bio?.trim() ??
    (displayProfile.user as { bio?: string; tagline?: string }).tagline?.trim() ??
    undefined;

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <ProfileView
        profile={displayProfile}
        avatarUrl={avatarUrl || undefined}
        bio={bioForDisplay}
        followersCount={followers.length}
        followingCount={following.length}
        isCurrentUser
        onOpenFollowers={() => setOpenList("followers")}
        onOpenFollowing={() => setOpenList("following")}
        onEditProfile={openEditProfile}
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

      {/* Edit Profile modal */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            clearAvatarSelection();
            setEditOpen(false);
          }
        }}
      >
        <DialogContent className="bg-card border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
            <DialogDescription>
              Update your display name, bio, and profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {editError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {editError}
              </p>
            )}
            {editSuccess && (
              <p className="text-sm text-green-500 bg-green-500/10 rounded-md px-3 py-2">
                Profile updated.
              </p>
            )}

            <div>
              <label htmlFor="edit-displayName" className="block text-sm font-medium text-foreground mb-1">
                Display name
              </label>
              <input
                id="edit-displayName"
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your name"
                maxLength={40}
                disabled={editLoading}
              />
              <p className="text-xs text-muted-foreground mt-0.5">
                {editForm.displayName.trim().length}/40
              </p>
            </div>

            <div>
              <label htmlFor="edit-tagline" className="block text-sm font-medium text-foreground mb-1">
                Bio
              </label>
              <textarea
                id="edit-tagline"
                value={editForm.tagline}
                onChange={(e) => setEditForm((f) => ({ ...f, tagline: e.target.value }))}
                className="w-full rounded-lg border border-white/20 bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-y"
                placeholder="A short bio..."
                maxLength={160}
                disabled={editLoading}
              />
              <p className="text-xs text-muted-foreground mt-0.5">
                {editForm.tagline.length}/160
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Profile picture
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Choose an image from your device (JPEG, PNG, GIF, or WebP, max 2 MB).
              </p>
              <input
                ref={avatarInputRef}
                id="edit-avatar-file"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleAvatarFileChange}
                className="w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-white/15"
                disabled={editLoading}
              />
              {avatarError && (
                <p className="text-sm text-destructive mt-1.5">{avatarError}</p>
              )}
              {avatarPreview && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border border-white/10 bg-muted"
                  />
                  <button
                    type="button"
                    onClick={clearAvatarSelection}
                    disabled={editLoading}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={editLoading || editForm.displayName.trim().length < 2}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              >
                {editLoading ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAvatarSelection();
                  setEditOpen(false);
                }}
                disabled={editLoading}
                className="px-4 py-2 rounded-lg border border-white/20 text-foreground text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
