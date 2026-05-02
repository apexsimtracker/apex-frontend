import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
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
import AdminRoute from "./auth/AdminRoute";
import Upload from "./pages/Upload";
import Upgrade from "./pages/Upgrade";
import Agent from "./pages/Agent";
import NotFound from "./pages/NotFound";
import QAPage from "./pages/QA";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQPage from "./pages/FAQ";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProRequiredBanner from "./components/ProRequiredBanner";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import AppFooter from "./components/AppFooter";
import SessionDataCacheSync from "./components/SessionDataCacheSync";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminComingSoonPage from "./pages/admin/AdminComingSoonPage";
import AdminChallenges from "./pages/admin/AdminChallenges";
import AdminChallengeDetail from "./pages/admin/AdminChallengeDetail";

const Profile = lazy(() => import("./pages/Profile"));
const ActivityDetail = lazy(() => import("./pages/ActivityDetail"));
const SessionDetailPage = lazy(() => import("./pages/SessionDetailPage"));
const DiscussionDetail = lazy(() => import("./pages/DiscussionDetail"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const ManualActivity = lazy(() => import("./pages/ManualActivity"));
const EditActivity = lazy(() => import("./pages/EditActivity"));

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
            <div className="flex min-h-screen flex-col bg-background">
              <Header />
              <ProRequiredBanner />
              <main className="flex min-h-0 flex-1 flex-col">
                <GlobalErrorBoundary>
                  <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute message="Sign in to view your activity feed.">
                          <Index />
                        </ProtectedRoute>
                      }
                    />
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
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute message="Sign in to manage your account settings.">
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
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
                      element={
                        <ProtectedRoute message="Sign in to join Apex Pro or the waitlist.">
                          <Upgrade />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/agent" element={<Agent />} />
                    <Route path="/activity/:id" element={<ActivityDetail />} />
                    <Route path="/sessions" element={<Sessions />} />
                    <Route path="/sessions/:id" element={<SessionDetailPage />} />
                    <Route path="/discussion/:id" element={<DiscussionDetail />} />
                    <Route path="/race/:id" element={<RaceDetail />} />
                    <Route path="/qa" element={<QAPage />} />
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
                        <Route
                          path="users"
                          element={<AdminComingSoonPage title="Users" path="/admin/users" />}
                        />
                        <Route
                          path="sessions"
                          element={<AdminComingSoonPage title="Sessions & laps" path="/admin/sessions" />}
                        />
                        <Route
                          path="tracks"
                          element={<AdminComingSoonPage title="Tracks & catalogs" path="/admin/tracks" />}
                        />
                        <Route path="challenges" element={<AdminChallenges />} />
                        <Route path="challenges/:challengeId" element={<AdminChallengeDetail />} />
                        <Route
                          path="community"
                          element={
                            <AdminComingSoonPage
                              title="Community & discussions"
                              path="/admin/community"
                            />
                          }
                        />
                        <Route
                          path="leaderboards"
                          element={
                            <AdminComingSoonPage title="Leaderboards" path="/admin/leaderboards" />
                          }
                        />
                        <Route
                          path="notifications"
                          element={
                            <AdminComingSoonPage title="Notifications" path="/admin/notifications" />
                          }
                        />
                        <Route
                          path="follows"
                          element={<AdminComingSoonPage title="Follow graph" path="/admin/follows" />}
                        />
                        <Route
                          path="billing"
                          element={<AdminComingSoonPage title="Billing & Pro" path="/admin/billing" />}
                        />
                        <Route
                          path="waitlist"
                          element={<AdminComingSoonPage title="Pro waitlist" path="/admin/waitlist" />}
                        />
                        <Route
                          path="devices"
                          element={
                            <AdminComingSoonPage title="Devices & agent" path="/admin/devices" />
                          }
                        />
                        <Route
                          path="email-auth"
                          element={
                            <AdminComingSoonPage title="Email & auth ops" path="/admin/email-auth" />
                          }
                        />
                        <Route
                          path="system"
                          element={<AdminComingSoonPage title="System" path="/admin/system" />}
                        />
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
