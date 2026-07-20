import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./auth/ProtectedRoute";
import GuestOnlyRoute from "./auth/GuestOnlyRoute";
import AdminRoute from "./auth/AdminRoute";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import SessionDataCacheSync from "./components/SessionDataCacheSync";
import AdminLayout from "./pages/admin/AdminLayout";
import ImpersonationExitFab from "./components/ImpersonationExitFab";
import AppLoadingScreen from "./components/AppLoadingScreen";
import AppLayout from "./components/AppLayout";
import BottomNav from "./components/BottomNav";
import HomeRoute from "./pages/HomeRoute";
import AgentTopBar from "./pages/agent/AgentTopBar";
import LeaderboardsTopBar from "./pages/leaderboards/LeaderboardsTopBar";
import ChallengesTopBar from "./pages/challenges/ChallengesTopBar";
import CommunityTopBar from "./pages/community/CommunityTopBar";
import DiscussionDetailTopBar from "./pages/discussion/DiscussionDetailTopBar";
import ChallengeDetailTopBar from "./pages/challenges/ChallengeDetailTopBar";
import SettingsTopBar from "./pages/settings/SettingsTopBar";
import ProfileTopBar from "./pages/profile/ProfileTopBar";
import UserProfileTopBar from "./pages/user/UserProfileTopBar";
import UploadTopBar from "./pages/upload/UploadTopBar";
import ManualTopBar from "./pages/manual/ManualTopBar";
import EditActivityTopBar from "./pages/session/EditActivityTopBar";
import SessionDetailTopBar from "./pages/session/SessionDetailTopBar";
import SessionsTopBar from "./pages/sessions/SessionsTopBar";
import PersonalBestsTopBar from "./pages/personal-bests/PersonalBestsTopBar";
import PricingTopBar from "./pages/pricing/PricingTopBar";
import AboutTopBar from "./pages/about/AboutTopBar";
import ContactTopBar from "./pages/contact/ContactTopBar";
import TermsAndConditionsTopBar from "./pages/legal/TermsAndConditionsTopBar";
import PrivacyPolicyTopBar from "./pages/legal/PrivacyPolicyTopBar";
import CookiePolicyTopBar from "./pages/legal/CookiePolicyTopBar";
import EULATopBar from "./pages/legal/EULATopBar";
import FAQTopBar from "./pages/faq/FAQTopBar";
import MaintenanceNoticeTopBar from "./pages/maintenance/MaintenanceNoticeTopBar";
import LoginTopBar from "./pages/login/LoginTopBar";
import SignupTopBar from "./pages/signup/SignupTopBar";
import ForgotPasswordTopBar from "./pages/forgot-password/ForgotPasswordTopBar";
import VerifyEmailTopBar from "./pages/verify-email/VerifyEmailTopBar";
import NotFound from "./pages/NotFound";
import NotFoundTopBar from "./pages/not-found/NotFoundTopBar";
import AppErrorBoundaryFallback from "./components/AppErrorBoundaryFallback";
import { isGuestAuthPath } from "./auth/guestAuthRoutes";
import { PageSuspense } from "./routes/PageSuspense";
import SessionsPageSkeleton from "./pages/sessions/SessionsPageSkeleton";
import ChallengeDetailSkeleton from "./pages/challenges/ChallengeDetailSkeleton";
import DiscussionDetailSkeleton from "./pages/discussion/DiscussionDetailSkeleton";
import LeaderboardsListSkeleton from "./pages/leaderboards/LeaderboardsListSkeleton";
import ChallengesSeasonStatsSkeleton from "./pages/challenges/ChallengesSeasonStatsSkeleton";
import ChallengeBrowseListSkeleton from "./pages/challenges/ChallengeBrowseListSkeleton";
import { DiscussionCardSkeleton } from "./pages/community/DiscussionCardSkeleton";
import {
  ProfileRouteSkeleton,
  SessionDetailRouteSkeleton,
  PricingRouteSkeleton,
  PersonalBestsRouteSkeleton,
  ManualActivityRouteSkeleton,
  UploadRouteSkeleton,
} from "./routes/routePageSkeletons";
import SettingsPageSkeleton from "./pages/settings/SettingsPageSkeleton";
import AgentPageSkeleton from "./pages/agent/AgentPageSkeleton";
import {
  AdminDashboard,
  AdminUsers,
  AdminSubscriptions,
  AdminUserDetail,
  AdminSessions,
  AdminSessionDetail,
  AdminTracks,
  AdminChallenges,
  AdminChallengeDetail,
  AdminContact,
  AdminContactDetail,
  AdminCommunity,
  AdminCommunityDiscussionDetail,
  AdminLeaderboards,
  AdminNotifications,
  AdminBroadcastDetail,
  AdminCampaignDetail,
  AdminFollows,
  AdminFollowUserDetail,
  AdminDevices,
  AdminEmailAuth,
  AdminSystem,
  Agent,
  Leaderboards,
  Challenges,
  Community,
  DiscussionDetail,
  Pricing,
  FAQ,
  About,
  MaintenanceNotice,
  Contact,
  TermsAndConditions,
  PrivacyPolicy,
  CookiePolicy,
  EULA,
  ChallengeDetail,
  Upload,
  ManualActivity,
  Sessions,
  EditActivity,
  SessionDetail,
  Settings,
  PersonalBests,
  Profile,
  UserProfile,
  Login,
  Signup,
  ForgotPassword,
  VerifyEmail,
} from "./routes/lazyPages";

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

/** Primary user-facing shell (formerly AppRouteShell). */
function AppShell({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const location = useLocation();
  const onGuestAuthPage = isGuestAuthPath(location.pathname);
  const isHomePath =
    location.pathname === "/" || location.pathname === "";
  const [homeReady, setHomeReady] = useState(!isHomePath);

  useEffect(() => {
    if (loading) {
      if (!isHomePath) setHomeReady(true);
      else setHomeReady(false);
      return;
    }
    if (!isHomePath) {
      setHomeReady(true);
      return;
    }

    let cancelled = false;
    const load = user
      ? import("@/pages/Dashboard")
      : import("@/pages/PublicHome");
    void load.then(() => {
      if (!cancelled) setHomeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, isHomePath]);

  if ((loading && !onGuestAuthPage) || (isHomePath && !homeReady && !onGuestAuthPage)) {
    return <AppLoadingScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <ImpersonationExitFab />
      <GlobalErrorBoundary
        fallback={AppErrorBoundaryFallback}
        resetKey={location.pathname}
      >
        {children}
      </GlobalErrorBoundary>
    </>
  );
}

/** Admin dashboard shell — no site Header/Footer; AdminLayout owns chrome. */
function AdminRouteShell({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <ImpersonationExitFab />
      <GlobalErrorBoundary resetKey="admin">{children}</GlobalErrorBoundary>
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SessionDataCacheSync />
          <Toaster theme="dark" />
          <BrowserRouter>
            <Routes>
              <Route
                path="/admin"
                element={
                  <AdminRouteShell>
                    <AdminRoute message="Sign in to access the admin dashboard." />
                  </AdminRouteShell>
                }
              >
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route
                    path="subscriptions"
                    element={<AdminSubscriptions />}
                  />
                  <Route path="users/:userId" element={<AdminUserDetail />} />
                  <Route path="sessions" element={<AdminSessions />} />
                  <Route
                    path="sessions/:sessionId"
                    element={<AdminSessionDetail />}
                  />
                  <Route path="tracks" element={<AdminTracks />} />
                  <Route path="challenges" element={<AdminChallenges />} />
                  <Route
                    path="challenges/:challengeId"
                    element={<AdminChallengeDetail />}
                  />
                  <Route path="contact" element={<AdminContact />} />
                  <Route
                    path="contact/:contactId"
                    element={<AdminContactDetail />}
                  />
                  <Route path="community" element={<AdminCommunity />} />
                  <Route
                    path="community/:discussionId"
                    element={<AdminCommunityDiscussionDetail />}
                  />
                  <Route path="leaderboards" element={<AdminLeaderboards />} />
                  <Route
                    path="notifications"
                    element={<AdminNotifications />}
                  />
                  <Route
                    path="notifications/broadcasts/:broadcastId"
                    element={<AdminBroadcastDetail />}
                  />
                  <Route
                    path="notifications/campaigns/:campaignId"
                    element={<AdminCampaignDetail />}
                  />
                  <Route path="follows" element={<AdminFollows />} />
                  <Route
                    path="follows/users/:userId"
                    element={<AdminFollowUserDetail />}
                  />
                  <Route path="devices" element={<AdminDevices />} />
                  <Route path="email-auth" element={<AdminEmailAuth />} />
                  <Route path="system" element={<AdminSystem />} />
                </Route>
              </Route>
              <Route
                path="*"
                element={
                  <AppShell>
                    <Routes>
                      <Route index element={<HomeRoute />} />
                      <Route
                        path="home"
                        element={<Navigate to="/" replace />}
                      />
                      <Route
                        path="agent"
                        element={
                          <AppLayout
                            topBar={<AgentTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<AgentPageSkeleton />}>
                              <Agent />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="leaderboards"
                        element={
                          <AppLayout
                            topBar={<LeaderboardsTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<LeaderboardsPageSkeleton />}>
                              <Leaderboards />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="challenges"
                        element={
                          <AppLayout
                            topBar={<ChallengesTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<ChallengesPageSkeleton />}>
                              <Challenges />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="community"
                        element={
                          <AppLayout
                            topBar={<CommunityTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<CommunityPageSkeleton />}>
                              <Community />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="discussion/:id"
                        element={
                          <AppLayout
                            topBar={<DiscussionDetailTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<DiscussionDetailSkeleton />}>
                              <DiscussionDetail />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="pricing"
                        element={
                          <AppLayout
                            topBar={<PricingTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<PricingRouteSkeleton />}>
                              <Pricing />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="faq"
                        element={
                          <AppLayout
                            topBar={<FAQTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense>
                              <FAQ />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="about"
                        element={
                          <AppLayout
                            topBar={<AboutTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense>
                              <About />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="status/maintenance/:maintenanceId"
                        element={
                          <AppLayout
                            topBar={<MaintenanceNoticeTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense>
                              <MaintenanceNotice />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="contact"
                        element={
                          <AppLayout
                            topBar={<ContactTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense>
                              <Contact />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="login"
                        element={
                          <GuestOnlyRoute redirectTo="/profile">
                            <AppLayout
                              topBar={<LoginTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense>
                                <Login />
                              </PageSuspense>
                            </AppLayout>
                          </GuestOnlyRoute>
                        }
                      />
                      <Route
                        path="signup"
                        element={
                          <GuestOnlyRoute redirectTo="/profile">
                            <AppLayout
                              topBar={<SignupTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense>
                                <Signup />
                              </PageSuspense>
                            </AppLayout>
                          </GuestOnlyRoute>
                        }
                      />
                      <Route
                        path="forgot-password"
                        element={
                          <GuestOnlyRoute redirectTo="/profile">
                            <AppLayout
                              topBar={<ForgotPasswordTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense>
                                <ForgotPassword />
                              </PageSuspense>
                            </AppLayout>
                          </GuestOnlyRoute>
                        }
                      />
                      <Route
                        path="verify-email"
                        element={
                          <GuestOnlyRoute redirectTo="/profile">
                            <AppLayout
                              topBar={<VerifyEmailTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense>
                                <VerifyEmail />
                              </PageSuspense>
                            </AppLayout>
                          </GuestOnlyRoute>
                        }
                      />
                      <Route
                        path="terms-and-conditions"
                        element={
                          <AppLayout
                            topBar={<TermsAndConditionsTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense>
                              <TermsAndConditions />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="privacy-policy"
                        element={
                          <AppLayout
                            topBar={<PrivacyPolicyTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense>
                              <PrivacyPolicy />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="cookie-policy"
                        element={
                          <AppLayout
                            topBar={<CookiePolicyTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense>
                              <CookiePolicy />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="eula"
                        element={
                          <AppLayout
                            topBar={<EULATopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense>
                              <EULA />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="challenge/:id"
                        element={
                          <AppLayout
                            topBar={<ChallengeDetailTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<ChallengeDetailSkeleton />}>
                              <ChallengeDetail />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="upload"
                        element={
                          <ProtectedRoute message="Sign in to upload sessions.">
                            <AppLayout
                              topBar={<UploadTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense fallback={<UploadRouteSkeleton />}>
                                <Upload />
                              </PageSuspense>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="manual"
                        element={
                          <ProtectedRoute message="Sign in to log a session.">
                            <AppLayout
                              topBar={<ManualTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense fallback={<ManualActivityRouteSkeleton />}>
                                <ManualActivity />
                              </PageSuspense>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="sessions"
                        element={
                          <ProtectedRoute message="Sign in to view your sessions.">
                            <AppLayout
                              topBar={<SessionsTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense fallback={<SessionsPageSkeleton />}>
                                <Sessions />
                              </PageSuspense>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="sessions/:id/edit"
                        element={
                          <ProtectedRoute message="Sign in to edit your session.">
                            <AppLayout
                              topBar={<EditActivityTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense fallback={<ManualActivityRouteSkeleton />}>
                                <EditActivity />
                              </PageSuspense>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="sessions/:id"
                        element={
                          <AppLayout
                            topBar={<SessionDetailTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<SessionDetailRouteSkeleton />}>
                              <SessionDetail />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="settings"
                        element={
                          <ProtectedRoute message="Sign in to manage your account settings.">
                            <AppLayout
                              topBar={<SettingsTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense fallback={<SettingsPageSkeleton />}>
                                <Settings />
                              </PageSuspense>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="personal-bests"
                        element={
                          <ProtectedRoute message="Sign in to view your personal bests.">
                            <AppLayout
                              topBar={<PersonalBestsTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense fallback={<PersonalBestsRouteSkeleton />}>
                                <PersonalBests />
                              </PageSuspense>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="profile"
                        element={
                          <ProtectedRoute message="Sign in to view your profile and stats.">
                            <AppLayout
                              topBar={<ProfileTopBar />}
                              bottomBar={<BottomNav />}
                            >
                              <PageSuspense fallback={<ProfileRouteSkeleton />}>
                                <Profile />
                              </PageSuspense>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="user/:userId"
                        element={
                          <AppLayout
                            topBar={<UserProfileTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <PageSuspense fallback={<ProfileRouteSkeleton showBackLink />}>
                              <UserProfile />
                            </PageSuspense>
                          </AppLayout>
                        }
                      />
                      <Route
                        path="*"
                        element={
                          <AppLayout
                            topBar={<NotFoundTopBar />}
                            bottomBar={<BottomNav />}
                          >
                            <NotFound />
                          </AppLayout>
                        }
                      />
                    </Routes>
                  </AppShell>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
