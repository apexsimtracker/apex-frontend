import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import HomeRoute from "./pages/HomeRoute";
import Community from "./pages/Community";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Leaderboards from "./pages/Leaderboards";
import Sessions from "./pages/Sessions";
import RaceDetail from "./pages/RaceDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./auth/ProtectedRoute";
import GuestOnlyRoute from "./auth/GuestOnlyRoute";
import AdminRoute from "./auth/AdminRoute";
import Upload from "./pages/Upload";
import Pricing from "./pages/Pricing";
import Agent from "./pages/Agent";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQPage from "./pages/FAQ";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProRequiredBanner from "./components/ProRequiredBanner";
import BroadcastBanner from "./components/BroadcastBanner";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import AppFooter from "./components/AppFooter";
import SessionDataCacheSync from "./components/SessionDataCacheSync";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminChallenges from "./pages/admin/AdminChallenges";
import AdminTracks from "./pages/admin/AdminTracks";
import AdminChallengeDetail from "./pages/admin/AdminChallengeDetail";
import AdminContact from "./pages/admin/AdminContact";
import AdminContactDetail from "./pages/admin/AdminContactDetail";
import AdminCommunity from "./pages/admin/AdminCommunity";
import AdminCommunityDiscussionDetail from "./pages/admin/AdminCommunityDiscussionDetail";
import AdminLeaderboards from "./pages/admin/AdminLeaderboards";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminSessionDetail from "./pages/admin/AdminSessionDetail";
import AdminDevices from "./pages/admin/AdminDevices";
import AdminEmailAuth from "./pages/admin/AdminEmailAuth";
import AdminFollows from "./pages/admin/AdminFollows";
import AdminFollowUserDetail from "./pages/admin/AdminFollowUserDetail";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSystem from "./pages/admin/AdminSystem";
import AdminBroadcastDetail from "./pages/admin/AdminBroadcastDetail";
import AdminCampaignDetail from "./pages/admin/AdminCampaignDetail";
import ImpersonationExitFab from "./components/ImpersonationExitFab";

const Profile = lazy(() => import("./pages/Profile"));
const SessionDetailPage = lazy(() => import("./pages/SessionDetailPage"));
const DiscussionDetail = lazy(() => import("./pages/DiscussionDetail"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const PersonalBests = lazy(() => import("./pages/PersonalBests"));
const ManualActivity = lazy(() => import("./pages/ManualActivity"));
const EditActivity = lazy(() => import("./pages/EditActivity"));
const MaintenanceNotice = lazy(() => import("./pages/MaintenanceNotice"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

/** Old bookmarks: `/manual/:sessionId/edit` → `/sessions/:id/edit`. */
function LegacyManualSessionEditRedirect() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = sessionId?.trim();
  if (!id) return <Navigate to="/" replace />;
  return <Navigate to={`/sessions/${id}/edit`} replace />;
}

/** Old bookmarks: `/activity/:id` → `/sessions/:id` (canonical session detail + Apex Analysis). */
function LegacyActivityDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const sessionId = id?.trim();
  if (!sessionId) return <Navigate to="/" replace />;
  return <Navigate to={`/sessions/${sessionId}`} replace />;
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
    // Set dark mode on app load
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SessionDataCacheSync />
          <Toaster theme="dark" />
          <BrowserRouter>
            <ScrollToTop />
            <ImpersonationExitFab />
            <div className="flex min-h-screen flex-col bg-background">
              <Header />
              <ProRequiredBanner />
              <BroadcastBanner />
              <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
                <GlobalErrorBoundary>
                  <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<HomeRoute />} />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute message="Sign in to view your profile and stats.">
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/user/:userId" element={<UserProfile />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/challenges" element={<Challenges />} />
                    <Route path="/challenge/:id" element={<ChallengeDetail />} />
                    <Route path="/leaderboards" element={<Leaderboards />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route
                      path="/personal-bests"
                      element={
                        <ProtectedRoute message="Sign in to view your personal bests.">
                          <PersonalBests />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute message="Sign in to manage your account settings.">
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/login"
                      element={
                        <GuestOnlyRoute>
                          <Login />
                        </GuestOnlyRoute>
                      }
                    />
                    <Route
                      path="/signup"
                      element={
                        <GuestOnlyRoute>
                          <Signup />
                        </GuestOnlyRoute>
                      }
                    />
                    <Route
                      path="/forgot-password"
                      element={
                        <GuestOnlyRoute>
                          <ForgotPassword />
                        </GuestOnlyRoute>
                      }
                    />
                    <Route
                      path="/verify-email"
                      element={
                        <GuestOnlyRoute>
                          <VerifyEmail />
                        </GuestOnlyRoute>
                      }
                    />
                    <Route
                      path="/upload"
                      element={
                        <ProtectedRoute message="Sign in to upload sessions.">
                          <Upload />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/manual"
                      element={
                        <ProtectedRoute message="Sign in to log a session.">
                          <ManualActivity />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/sessions/:id/edit"
                      element={
                        <ProtectedRoute message="Sign in to edit your session.">
                          <EditActivity />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/manual/:sessionId/edit"
                      element={
                        <ProtectedRoute message="Sign in to edit your session.">
                          <LegacyManualSessionEditRedirect />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/upgrade"
                      element={<Navigate to="/pricing" replace />}
                    />
                    <Route path="/agent" element={<Agent />} />
                    <Route path="/activity/:id" element={<LegacyActivityDetailRedirect />} />
                    <Route
                      path="/sessions"
                      element={
                        <ProtectedRoute message="Sign in to view your sessions.">
                          <Sessions />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/sessions/:id" element={<SessionDetailPage />} />
                    <Route path="/discussion/:id" element={<DiscussionDetail />} />
                    <Route path="/race/:id" element={<RaceDetail />} />
                    <Route
                      path="/status/maintenance/:maintenanceId"
                      element={<MaintenanceNotice />}
                    />
                    <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route
                      path="/admin"
                      element={<AdminRoute message="Sign in to access the admin dashboard." />}
                    >
                      <Route element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="users/:userId" element={<AdminUserDetail />} />
                        <Route path="sessions" element={<AdminSessions />} />
                        <Route path="sessions/:sessionId" element={<AdminSessionDetail />} />
                        <Route path="tracks" element={<AdminTracks />} />
                        <Route path="challenges" element={<AdminChallenges />} />
                        <Route path="challenges/:challengeId" element={<AdminChallengeDetail />} />
                        <Route path="contact" element={<AdminContact />} />
                        <Route path="contact/:contactId" element={<AdminContactDetail />} />
                        <Route path="community" element={<AdminCommunity />} />
                        <Route
                          path="community/:discussionId"
                          element={<AdminCommunityDiscussionDetail />}
                        />
                        <Route path="leaderboards" element={<AdminLeaderboards />} />
                        <Route path="notifications" element={<AdminNotifications />} />
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
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </GlobalErrorBoundary>
              </main>
              <AppFooter />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
