import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Leaderboards from "./pages/Leaderboards";
import ActivityDetail from "./pages/ActivityDetail";
import Sessions from "./pages/Sessions";
import SessionDetailPage from "./pages/SessionDetailPage";
import DiscussionDetail from "./pages/DiscussionDetail";
import RaceDetail from "./pages/RaceDetail";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import RequireAuth from "./auth/RequireAuth";
import Upload from "./pages/Upload";
import ManualActivity from "./pages/ManualActivity";
import EditManualActivity from "./pages/EditManualActivity";
import Upgrade from "./pages/Upgrade";
import Agent from "./pages/Agent";
import NotFound from "./pages/NotFound";
import QAPage from "./pages/QA";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FAQPage from "./pages/FAQ";
import About from "./pages/About";
import ProRequiredBanner from "./components/ProRequiredBanner";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import AppFooter from "./components/AppFooter";

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
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen bg-background">
              <Header />
              <ProRequiredBanner />
              <main className="flex flex-1 flex-col min-h-0">
                <GlobalErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                    <Route path="/user/:userId" element={<UserProfile />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/challenges" element={<Challenges />} />
                    <Route path="/challenge/:id" element={<ChallengeDetail />} />
                    <Route path="/leaderboards" element={<Leaderboards />} />
                    <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/manual" element={<ManualActivity />} />
                    <Route path="/manual/:sessionId/edit" element={<EditManualActivity />} />
                    <Route path="/upgrade" element={<Upgrade />} />
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
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
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
