import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import RequireAuth from "./auth/RequireAuth";
import Upload from "./pages/Upload";
import ManualActivity from "./pages/ManualActivity";
import EditManualActivity from "./pages/EditManualActivity";
import Upgrade from "./pages/Upgrade";
import Agent from "./pages/Agent";
import NotFound from "./pages/NotFound";
import QAPage from "./pages/QA";
import ProRequiredBanner from "./components/ProRequiredBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import AppFooter from "./components/AppFooter";

const queryClient = new QueryClient();

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
            <ErrorBoundary>
              <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <ProRequiredBanner />
                <main className="flex-1">
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/user/:username" element={<UserProfile />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/challenges" element={<Challenges />} />
                  <Route path="/challenge/:id" element={<ChallengeDetail />} />
                  <Route path="/leaderboards" element={<Leaderboards />} />
                  <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
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
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <AppFooter />
              </div>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
