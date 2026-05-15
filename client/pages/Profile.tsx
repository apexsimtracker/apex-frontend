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
  authLogout,
  getProfileSummary,
  getProfileRaceHistory,
  getUserPublicProfile,
  RACE_HISTORY_PAGE_SIZE,
  updateMe,
  uploadProfileAvatar,
  type ProfileSummary,
  type AuthUser,
} from "@/lib/api";
import {
  BaseModal,
} from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
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
import { FollowListDialog } from "@/components/FollowListDialog";
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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (matches API)

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

  // Summary + race history are token-scoped; run whenever we're authenticated (ProtectedRoute), even if
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

  const { data: publicPreview } = useQuery({
    queryKey: profileKeys.publicPreview(followsUserId),
    queryFn: () => getUserPublicProfile(followsUserId),
    enabled: Boolean(followsUserId),
  });

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
      setAvatarError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError("Image must be 5 MB or smaller.");
      return;
    }
    void (async () => {
      try {
        await readImageDimensions(file);
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

  const handleSignOut = async () => {
    try {
      await authLogout();
    } catch {
      // Server revoke is best-effort; always clear local credentials.
    }
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
        void queryClient.invalidateQueries({
          queryKey: profileKeys.publicPreview(followsId),
        });
        void queryClient.invalidateQueries({
          queryKey: ["profile", "followList", followsId],
        });
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
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <p className="text-white/60">Loading...</p>
        </div>
      </>
    );
  }
  if (!user) {
    return (
      <>
        <PageMeta title={profileTitle} description={profileDescription} path={PROFILE_PATH} />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center sm:p-8">
          <p className="mb-4 text-white/80">Not signed in.</p>
          <Link
            to="/login"
            className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
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

  const profileSeoTitle = `${accountName} | ${COMPANY_NAME}`;
  const profileSeoDescription =
    bioForDisplay && bioForDisplay.trim().length > 0
      ? `${bioForDisplay.trim().slice(0, 160)}${bioForDisplay.length > 160 ? "…" : ""}`
      : `${accountName}'s ${COMPANY_NAME} driver profile, stats, and race history at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

  return (
    <>
      <PageMeta
        title={profileSeoTitle}
        description={profileSeoDescription}
        path={PROFILE_PATH}
        image={avatarUrl}
      />
      <div className="flex min-h-screen flex-col bg-background">
      <ProfileView
        profile={displayProfile}
        avatarUrl={avatarUrl || undefined}
        bio={bioForDisplay}
        followersCount={publicPreview?.followersCount ?? 0}
        followingCount={publicPreview?.followingCount ?? 0}
        isCurrentUser
        challengeBadges={publicPreview?.challengeBadges}
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
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-end gap-2">
          {memberSince && (
            <p className="text-sm text-white/50">Member since {memberSince}</p>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "rgb(240, 28, 28)" }}
          >
            Sign out
          </button>
        </div>
      </div>
      <FollowListDialog
        key={`${followsUserId}-${openList ?? "closed"}`}
        open={openList !== null}
        onOpenChange={(open) => !open && setOpenList(null)}
        userId={followsUserId}
        listKind={openList}
      />

      {/* Edit Profile modal */}
      <BaseModal
        isOpen={editOpen}
        onClose={() => {
          clearAvatarSelection();
          setEditOpen(false);
        }}
        title="Edit Profile"
        description="Update your display name, bio, and profile picture."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearAvatarSelection();
                setEditOpen(false);
              }}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-profile-form"
              disabled={
                editLoading || profileEditForm.watch("displayName").trim().length < 2
              }
            >
              {editLoading ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
          <Form {...profileEditForm}>
            <form
              id="edit-profile-form"
              onSubmit={profileEditForm.handleSubmit(onSaveProfileSubmit)}
              className="space-y-4"
            >
              <FormRootMessage className="rounded-md bg-red-500/10 px-3 py-2" />
              {editSuccess && (
                <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-500">
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
                    <p className="mt-0.5 text-xs text-muted-foreground">
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
                        className="min-h-[80px] w-full resize-y rounded-lg border border-white/20 bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="A short bio..."
                        maxLength={160}
                        disabled={editLoading}
                        {...field}
                      />
                    </FormControl>
                    <p className="mt-0.5 text-xs text-muted-foreground">{field.value.length}/160</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Profile picture
              </label>
              <p className="mb-2 text-xs text-muted-foreground">
                Choose an image from your device (JPEG, PNG, or WebP, max 5 MB). Images are cropped to a square on upload.
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
                <p className="mt-1.5 text-sm text-destructive">{avatarError}</p>
              )}
              {avatarPreview && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="size-16 rounded-full border border-white/10 bg-muted object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearAvatarSelection}
                    disabled={editLoading}
                    className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            </form>
          </Form>
      </BaseModal>
    </div>
    </>
  );
}
