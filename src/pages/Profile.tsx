import { useState, useCallback, useRef, lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { MeResponse } from "@/auth/api";
import { resolveApiUrl } from "@/lib/api/config";
import { authMe, updateMe, uploadProfileAvatar } from "@/lib/api/authAndContact";
import {
  getProfileSummary,
  getProfileRaceHistory,
  getUserPublicProfile,
  RACE_HISTORY_PAGE_SIZE,
  type ProfileSummary,
} from "@/lib/api/profile";
import type { AuthUser } from "@/lib/api/authAndContact";
import type { WithRootError } from "@/lib/formWithRootError";
import {
  profileEditFormSchema,
  type ProfileEditFormValues,
} from "@/lib/validation/profileEdit";
import { ProfileView } from "@/components/profile/ProfileView";
import { FollowListDialog } from "@/components/FollowListDialog";
import ProfileSkeleton from "@/pages/profile/ProfileSkeleton";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import {
  ownedProfileUserKey,
  profileKeys,
  prefetchFollowList,
  PROFILE_SUMMARY_ALL_QUERY_FILTER,
} from "@/lib/profileQueryKeys";

const ProfileEditModal = lazy(() => import("@/pages/profile/ProfileEditModal"));

const PROFILE_PATH = "/profile";
const contentRootClassName =
  "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8";
const profileTitle = `Profile | ${COMPANY_NAME}`;
const profileDescription = `Your ${COMPANY_NAME} driver profile, stats, and race history.`;

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
function getAccountDisplayName(user: {
  displayName?: string;
  name?: string;
  email?: string;
}): string {
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

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
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

  const profileUserKey = ownedProfileUserKey(user);
  const followsUserId = user?.id?.trim() ?? "";

  const summaryQuery = useQuery({
    queryKey: profileKeys.summary(profileUserKey),
    queryFn: getProfileSummary,
    enabled: Boolean(user),
  });
  const profileSummary = summaryQuery.data;

  const {
    data: raceHistoryData,
    isPending: raceHistoryLoading,
    isFetching: raceHistoryFetching,
  } = useQuery({
    queryKey: profileKeys.raceHistory(profileUserKey, raceHistoryPage),
    queryFn: () =>
      getProfileRaceHistory({
        page: raceHistoryPage,
        limit: RACE_HISTORY_PAGE_SIZE,
      }),
    enabled: Boolean(user),
    placeholderData: (previousData) => previousData,
  });

  const {
    data: publicPreview,
    isPending: publicPreviewLoading,
  } = useQuery({
    queryKey: profileKeys.publicPreview(followsUserId),
    queryFn: () => getUserPublicProfile(followsUserId),
    enabled: Boolean(followsUserId),
  });

  const [openList, setOpenList] = useState<"followers" | "following" | null>(
    null,
  );

  const [editOpen, setEditOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileSaveInFlightRef = useRef(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  const profileEditForm = useForm<WithRootError<ProfileEditFormValues>>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: { displayName: "", tagline: "" },
    mode: "onChange",
  });

  const openEditProfile = useCallback(() => {
    if (!user) return;
    const name = getAccountDisplayName(user);
    const currentBio =
      (profileSummary?.user as { tagline?: string; bio?: string })?.bio?.trim() ??
      (profileSummary?.user as { tagline?: string; bio?: string })?.tagline?.trim() ??
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
  }, [user, profileSummary, profileEditForm]);

  const handleAvatarFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [avatarPreview],
  );

  const clearAvatarSelection = useCallback(() => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }, [avatarPreview]);

  const onSaveProfileSubmit = async (values: ProfileEditFormValues) => {
    if (!user || profileSaveInFlightRef.current) return;
    const previousAvatarUrl = (user as AuthUser).avatarUrl ?? undefined;
    const trimmedName = values.displayName.trim();
    if (avatarError) return;
    profileSaveInFlightRef.current = true;
    setEditLoading(true);
    profileEditForm.clearErrors("root");
    try {
      let avatarUrlToSet: string | undefined;
      let uploadedAvatarForSession: string | undefined;
      if (avatarFile) {
        try {
          const uploadRes = await uploadProfileAvatar(avatarFile);
          avatarUrlToSet = uploadRes.avatarUrl;
          uploadedAvatarForSession = withCacheBust(avatarUrlToSet, Date.now());
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Avatar upload failed.";
          profileEditForm.setError("root", { type: "server", message: msg });
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
        (u.bio?.trim() ?? u.tagline?.trim() ?? values.tagline.trim()) ||
        undefined;

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
            : profileSummaryFromMe({ user: userWithAvatar }),
      );

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
              : freshUser,
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
      profileSaveInFlightRef.current = false;
    }
  };

  if (loading || !user) {
    return (
      <>
        <PageMeta
          title={profileTitle}
          description={profileDescription}
          path={PROFILE_PATH}
          noindex
        />
        <div className={contentRootClassName}>
          <ProfileSkeleton />
        </div>
      </>
    );
  }

  const accountName = getAccountDisplayName(user);
  const me: MeResponse = { user };
  const displayProfile: ProfileSummary = profileSummary
    ? { ...profileSummary, user: { ...profileSummary.user, displayName: accountName } }
    : profileSummaryFromMe(me);

  const avatarUrl = resolveApiUrl((user as AuthUser).avatarUrl) ?? undefined;
  const bioForDisplay =
    (user as AuthUser).bio?.trim() ??
    (user as AuthUser).tagline?.trim() ??
    (displayProfile.user as { bio?: string; tagline?: string }).bio?.trim() ??
    (
      displayProfile.user as { bio?: string; tagline?: string }
    ).tagline?.trim() ??
    undefined;

  const profileSeoTitle = `${accountName} | ${COMPANY_NAME}`;
  const profileSeoDescription =
    bioForDisplay && bioForDisplay.trim().length > 0
      ? `${bioForDisplay.trim().slice(0, 160)}${bioForDisplay.length > 160 ? "…" : ""}`
      : `${accountName}'s ${COMPANY_NAME} driver profile, stats, and race history.`;

  return (
    <>
      <PageMeta
        title={profileSeoTitle}
        description={profileSeoDescription}
        path={PROFILE_PATH}
        image={avatarUrl}
        noindex
      />
      <div className={contentRootClassName}>
        <ProfileView
          profile={displayProfile}
          avatarUrl={avatarUrl || undefined}
          bio={bioForDisplay}
          followersCount={publicPreview?.followersCount ?? 0}
          followingCount={publicPreview?.followingCount ?? 0}
          isCurrentUser
          isPro={user.hasPro === true}
          profileUserId={followsUserId}
          challengeBadges={publicPreview?.challengeBadges}
          challengeBadgeCount={publicPreview?.challengeBadgeCount}
          challengeBadgesLoading={
            Boolean(followsUserId) && publicPreviewLoading
          }
          summaryLoading={summaryQuery.isPending}
          onOpenFollowers={() => setOpenList("followers")}
          onOpenFollowing={() => setOpenList("following")}
          onPrefetchFollowers={() =>
            prefetchFollowList(queryClient, followsUserId, "followers")
          }
          onPrefetchFollowing={() =>
            prefetchFollowList(queryClient, followsUserId, "following")
          }
          onEditProfile={openEditProfile}
          raceHistoryPagination={{
            page: raceHistoryData?.page ?? raceHistoryPage,
            limit: raceHistoryData?.limit ?? RACE_HISTORY_PAGE_SIZE,
            totalPages: raceHistoryData?.totalPages ?? 1,
            total: raceHistoryData?.total ?? 0,
            items: raceHistoryData?.items ?? [],
            loading: raceHistoryLoading,
            fetching: raceHistoryFetching,
            onPageChange: setRaceHistoryPage,
          }}
        />
      </div>

      <FollowListDialog
        key={`${followsUserId}-${openList ?? "closed"}`}
        open={openList !== null}
        onOpenChange={(open) => !open && setOpenList(null)}
        userId={followsUserId}
        listKind={openList}
        profileLinkBase="/user"
      />

      {editOpen ? (
        <Suspense fallback={null}>
          <ProfileEditModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            profileEditForm={profileEditForm}
            onSave={onSaveProfileSubmit}
            editLoading={editLoading}
            editSuccess={editSuccess}
            avatarInputRef={avatarInputRef}
            avatarPreview={avatarPreview}
            avatarError={avatarError}
            onAvatarFileChange={handleAvatarFileChange}
            onClearAvatarSelection={clearAvatarSelection}
          />
        </Suspense>
      ) : null}
    </>
  );
}
