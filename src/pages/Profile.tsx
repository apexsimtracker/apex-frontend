import { useState, useCallback, useRef, lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { MeResponse } from "@/auth/api";
import { resolveApiUrl } from "@/lib/api/config";
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
} from "@/lib/profileQueryKeys";
import { useAvatarFileSelection } from "@/features/profile/useAvatarFileSelection";
import { saveProfileIdentity } from "@/features/profile/saveProfileIdentity";

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
  const {
    avatarFile,
    avatarPreview,
    avatarError,
    avatarInputRef,
    handleAvatarFileChange,
    clearAvatarSelection,
  } = useAvatarFileSelection();
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
      (user as AuthUser).bio?.trim() ??
      (user as AuthUser).tagline?.trim() ??
      (profileSummary?.user as { tagline?: string; bio?: string })?.bio?.trim() ??
      (profileSummary?.user as { tagline?: string; bio?: string })?.tagline?.trim() ??
      "";
    profileEditForm.reset({
      displayName: name,
      tagline: currentBio,
    });
    clearAvatarSelection();
    profileEditForm.clearErrors("root");
    setEditSuccess(false);
    setEditOpen(true);
  }, [user, profileSummary, profileEditForm, clearAvatarSelection]);

  const onSaveProfileSubmit = async (values: ProfileEditFormValues) => {
    if (!user || profileSaveInFlightRef.current) return;
    profileSaveInFlightRef.current = true;
    setEditLoading(true);
    try {
      const ok = await saveProfileIdentity({
        user,
        values,
        avatarFile,
        avatarError,
        form: profileEditForm,
        queryClient,
        setUser,
        refreshMe,
        emptySummaryFromUser: (u) => profileSummaryFromMe({ user: u }),
      });
      if (!ok) return;
      setEditSuccess(true);
      clearAvatarSelection();
      setTimeout(() => {
        setEditOpen(false);
        setEditSuccess(false);
      }, 800);
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
