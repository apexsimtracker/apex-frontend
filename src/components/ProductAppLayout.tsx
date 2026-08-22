import { type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import BottomNav from "@/components/BottomNav";
import HubTopBar from "@/components/HubTopBar";
import { useAuth } from "@/contexts/AuthContext";
import AgentPageSkeleton from "@/pages/agent/AgentPageSkeleton";
import ChallengeBrowseListSkeleton from "@/pages/challenges/ChallengeBrowseListSkeleton";
import ChallengeDetailSkeleton from "@/pages/challenges/ChallengeDetailSkeleton";
import ChallengesSeasonStatsSkeleton from "@/pages/challenges/ChallengesSeasonStatsSkeleton";
import { DiscussionCardSkeleton } from "@/pages/community/DiscussionCardSkeleton";
import DashboardSkeleton from "@/pages/dashboard/DashboardSkeleton";
import DiscussionDetailSkeleton from "@/pages/discussion/DiscussionDetailSkeleton";
import LeaderboardsListSkeleton from "@/pages/leaderboards/LeaderboardsListSkeleton";
import SessionsPageSkeleton from "@/pages/sessions/SessionsPageSkeleton";
import SettingsPageSkeleton from "@/pages/settings/SettingsPageSkeleton";
import { GenericRouteSkeleton } from "@/routes/GenericRouteSkeleton";
import { PageSuspense } from "@/routes/PageSuspense";
import OfflineBanner from "@/components/OfflineBanner";
import {
  ManualActivityRouteSkeleton,
  PersonalBestsRouteSkeleton,
  PricingRouteSkeleton,
  ProfileRouteSkeleton,
  SessionDetailRouteSkeleton,
  UploadRouteSkeleton,
} from "@/routes/routePageSkeletons";

function ChallengesPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <ChallengesSeasonStatsSkeleton />
      <ChallengeBrowseListSkeleton />
    </div>
  );
}

function CommunityPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <DiscussionCardSkeleton count={3} />
    </div>
  );
}

function LeaderboardsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-6 py-8">
      <LeaderboardsListSkeleton />
    </div>
  );
}

/** Pathname → route-chunk Suspense fallback (cold entry / deep link only). */
function skeletonForPath(pathname: string, signedIn: boolean): ReactNode {
  if (pathname === "/" || pathname === "") {
    return signedIn ? <DashboardSkeleton /> : <GenericRouteSkeleton />;
  }
  if (pathname === "/agent") return <AgentPageSkeleton />;
  if (pathname === "/leaderboards") return <LeaderboardsPageSkeleton />;
  if (pathname === "/challenges") return <ChallengesPageSkeleton />;
  if (pathname === "/community") return <CommunityPageSkeleton />;
  if (pathname.startsWith("/discussion/")) return <DiscussionDetailSkeleton />;
  if (pathname === "/pricing") return <PricingRouteSkeleton />;
  if (pathname.startsWith("/challenge/")) return <ChallengeDetailSkeleton />;
  if (pathname === "/upload") return <UploadRouteSkeleton />;
  if (pathname === "/manual") return <ManualActivityRouteSkeleton />;
  if (pathname === "/sessions") return <SessionsPageSkeleton />;
  if (/^\/sessions\/[^/]+\/edit$/.test(pathname)) {
    return <ManualActivityRouteSkeleton />;
  }
  if (pathname.startsWith("/sessions/")) return <SessionDetailRouteSkeleton />;
  if (pathname === "/settings") return <SettingsPageSkeleton />;
  if (pathname === "/personal-bests") return <PersonalBestsRouteSkeleton />;
  if (pathname === "/profile") return <ProfileRouteSkeleton />;
  if (pathname.startsWith("/user/")) {
    return <ProfileRouteSkeleton showBackLink />;
  }
  return <GenericRouteSkeleton />;
}

/**
 * Stable product chrome + one PageSuspense around Outlet so React Router's
 * startTransition can keep the previous page while the next lazy chunk loads.
 *
 * The top bar is a single element type for every route: swapping the component
 * type per route made React remount the header (and reload its logo) on each
 * home <-> subpage navigation.
 */
export default function ProductAppLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return (
    <AppLayout topBar={<HubTopBar />} bottomBar={<BottomNav />}>
      <OfflineBanner />
      <PageSuspense fallback={skeletonForPath(pathname, Boolean(user))}>
        <Outlet />
      </PageSuspense>
    </AppLayout>
  );
}
