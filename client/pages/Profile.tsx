import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { MeResponse } from "@/auth/api";
import { clearToken } from "@/auth/token";
import {
  resolveApiUrl,
  authMe,
  getFollowers,
  getFollowing,
  getProfileSummary,
  getProfileRaceHistory,
  RACE_HISTORY_PAGE_SIZE,
  updateMe,
  uploadProfileAvatar,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootMessage,
} from "@/components/ui/form";
import type { WithRootError } from "@/lib/formWithRootError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  profileEditFormSchema,
  type ProfileEditFormValues,
} from "@/lib/validation/profileEdit";
import { ProfileView } from "@/components/ProfileView";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import {
  ownedProfileUserKey,
  profileKeys,
  PROFILE_SUMMARY_ALL_QUERY_FILTER,
} from "@/lib/profileQueryKeys";

const PROFILE_PATH = "/profile";
const profileTitle = `Profile | ${COMPANY_NAME}`;
const profileDescription = `Your ${COMPANY_NAME} driver profile, stats, and race history at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

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
  return "";
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
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_AVATAR_DIMENSION = 400; // Require at least 400x400 for quality

function withCacheBust(url: string, stamp: number): string {
  return `${url}${url.includes("?") ? "&" : "?"}t=${stamp}`;
}

function stripQuery(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const idx = url.indexOf("?");
  return idx >= 0 ? url.slice(0, idx) : url;
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Invalid image file."));
    };
    img.src = objectUrl;
  });
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { user, loading, refreshMe, setUser } = useAuth();
  const [raceHistoryPage, setRaceHistoryPage] = useState(1);

  // Summary + race history are token-scoped; run whenever we're authenticated (RequireAuth), even if
  // `user.id` is missing from the /me payload (some backends omit it briefly).
  const profileUserKey = ownedProfileUserKey(user);
  const followsUserId = user?.id?.trim() ?? "";

  const { data: profileSummary } = useQuery({
    queryKey: profileKeys.summary(profileUserKey),
    queryFn: getProfileSummary,
    enabled: Boolean(user),
  });

  const { data: raceHistoryData, isPending: raceHistoryLoading } = useQuery({
    queryKey: profileKeys.raceHistory(profileUserKey, raceHistoryPage),
    queryFn: () =>
      getProfileRaceHistory({
        page: raceHistoryPage,
        limit: RACE_HISTORY_PAGE_SIZE,
      }),
    enabled: Boolean(user),
  });

  const {
    data: followsData,
    isPending: followsLoading,
    error: followsErrorRaw,
  } = useQuery({
    queryKey: profileKeys.follows(followsUserId),
    queryFn: async () => {
      const [f1, f2] = await Promise.all([
        getFollowers(followsUserId),
        getFollowing(followsUserId),
      ]);
      return {
        followers: Array.isArray(f1) ? f1 : [],
        following: Array.isArray(f2) ? f2 : [],
      };
    },
    enabled: Boolean(followsUserId),
  });

  const followers = followsData?.followers ?? [];
  const following = followsData?.following ?? [];
  const followsError =
    followsErrorRaw instanceof Error
      ? followsErrorRaw.message
      : followsErrorRaw
        ? "Failed to load followers/following."
        : null;
  const [openList, setOpenList] = useState<"followers" | "following" | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  const profileEditForm = useForm<WithRootError<ProfileEditFormValues>>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: { displayName: "", tagline: "" },
    mode: "onChange",
  });

  const profile =
    profileSummary ??
    (user ? profileSummaryFromMe({ user }) : null);

  const openEditProfile = useCallback(() => {
    if (!user) return;
    const name = getAccountDisplayName(user);
    const currentBio =
      (profile?.user as { tagline?: string; bio?: string })?.bio?.trim() ??
      (profile?.user as { tagline?: string; bio?: string })?.tagline?.trim() ??
      "";
    profileEditForm.reset({
      displayName: name,
      tagline: currentBio,
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
    profileEditForm.clearErrors("root");
    setEditSuccess(false);
    setEditOpen(true);
  }, [user, profile, profileEditForm]);

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
      setAvatarError("Image must be 5 MB or smaller.");
      return;
    }
    void (async () => {
      try {
        const { width, height } = await readImageDimensions(file);
        if (width < MIN_AVATAR_DIMENSION || height < MIN_AVATAR_DIMENSION) {
          setAvatarError(`Image must be at least ${MIN_AVATAR_DIMENSION}x${MIN_AVATAR_DIMENSION}px.`);
          return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      } catch {
        setAvatarError("Invalid image file.");
      }
    })();
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

  const handleSignOut = () => {
    clearToken();
    window.location.href = "/login";
  };

  const onSaveProfileSubmit = async (values: ProfileEditFormValues) => {
    if (!user) return;
    const previousAvatarUrl = (user as AuthUser).avatarUrl ?? undefined;
    const trimmedName = values.displayName.trim();
    if (avatarError) return;
    setEditLoading(true);
    profileEditForm.clearErrors("root");
    try {
      let avatarUrlToSet: string | undefined;
      let uploadedAvatarForSession: string | undefined;
      if (avatarFile) {
        try {
          const uploadRes = await uploadProfileAvatar(avatarFile);
          avatarUrlToSet = uploadRes.avatarUrl;
          // Persist cache-busted avatar in global auth user for this session.
          uploadedAvatarForSession = withCacheBust(avatarUrlToSet, Date.now());
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Avatar upload failed.";
          profileEditForm.setError("root", { type: "server", message: msg });
          setEditLoading(false);
          return;
        }
      }
      const bioValue = values.tagline.trim() || undefined;
      const payload = {
        displayName: trimmedName,
        tagline: bioValue,
        bio: bioValue,
        avatarUrl: avatarUrlToSet ?? undefined,
      };

      const updated = await updateMe(payload);

      const u = updated as { tagline?: string; bio?: string };
      const savedBio =
        (u.bio?.trim() ?? u.tagline?.trim() ?? values.tagline.trim()) || undefined;

      const userWithAvatar = {
        ...updated,
        avatarUrl:
          uploadedAvatarForSession ??
          (updated as AuthUser).avatarUrl ??
          undefined,
      };
      setUser(userWithAvatar);
      queryClient.setQueryData<ProfileSummary>(
        profileKeys.summary(ownedProfileUserKey(user)),
        (prev) =>
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
            : profileSummaryFromMe({ user: userWithAvatar })
      );

      // Re-sync from backend only after upload/save has settled.
      // If backend still returns stale avatar briefly, preserve the freshly uploaded URL.
      if (avatarUrlToSet) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          const freshUser = await authMe();
          const freshAvatar = freshUser.avatarUrl ?? undefined;
          const freshAvatarBase = stripQuery(freshAvatar);
          const previousAvatarBase = stripQuery(previousAvatarUrl);
          const shouldPreserveUploadedAvatar =
            !freshAvatarBase || freshAvatarBase === previousAvatarBase;
          setUser(
            shouldPreserveUploadedAvatar
              ? {
                  ...freshUser,
                  avatarUrl:
                    uploadedAvatarForSession ??
                    withCacheBust(avatarUrlToSet, Date.now()),
                }
              : freshUser
          );
        } catch {
          // Keep optimistic user state if refresh fails.
        }
      } else {
        await refreshMe();
      }

      void queryClient.invalidateQueries(PROFILE_SUMMARY_ALL_QUERY_FILTER);
      const followsId = user.id?.trim();
      if (followsId) {
        void queryClient.invalidateQueries({ queryKey: profileKeys.follows(followsId) });
      }

      setEditSuccess(true);
      clearAvatarSelection();
      setTimeout(() => {
        setEditOpen(false);
        setEditSuccess(false);
      }, 800);
    } catch (e) {
      profileEditForm.setError("root", {
        type: "server",
        message: e instanceof Error ? e.message : "Failed to update profile.",
      });
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title={profileTitle} description={profileDescription} path={PROFILE_PATH} />
        <div className="bg-background min-h-screen flex items-center justify-center p-6">
          <p className="text-white/60">Loading...</p>
        </div>
      </>
    );
  }
  if (!user) {
    return (
      <>
        <PageMeta title={profileTitle} description={profileDescription} path={PROFILE_PATH} />
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
      </>
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

  const avatarUrl = resolveApiUrl((user as AuthUser).avatarUrl) ?? undefined;
  const bioForDisplay =
    (user as AuthUser).bio?.trim() ??
    (user as AuthUser).tagline?.trim() ??
    (displayProfile.user as { bio?: string; tagline?: string }).bio?.trim() ??
    (displayProfile.user as { bio?: string; tagline?: string }).tagline?.trim() ??
    undefined;

  return (
    <>
      <PageMeta title={profileTitle} description={profileDescription} path={PROFILE_PATH} />
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
          <Form {...profileEditForm}>
            <form
              onSubmit={profileEditForm.handleSubmit(onSaveProfileSubmit)}
              className="space-y-4 pt-2"
            >
              <FormRootMessage className="bg-red-500/10 rounded-md px-3 py-2" />
              {editSuccess && (
                <p className="text-sm text-green-500 bg-green-500/10 rounded-md px-3 py-2">
                  Profile updated.
                </p>
              )}

              <FormField
                control={profileEditForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="edit-displayName">Display name</FormLabel>
                    <FormControl>
                      <Input
                        id="edit-displayName"
                        type="text"
                        className="w-full rounded-lg border border-white/20 bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Your name"
                        maxLength={40}
                        disabled={editLoading}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {field.value.trim().length}/40
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileEditForm.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="edit-tagline">Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        id="edit-tagline"
                        className="w-full rounded-lg border border-white/20 bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-y"
                        placeholder="A short bio..."
                        maxLength={160}
                        disabled={editLoading}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-0.5">{field.value.length}/160</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Profile picture
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Choose an image from your device (JPEG, PNG, GIF, or WebP, at least 400x400, max 5 MB).
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
                  type="submit"
                  disabled={
                    editLoading || profileEditForm.watch("displayName").trim().length < 2
                  }
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
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
