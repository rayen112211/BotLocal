import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardLayout from "./components/DashboardLayout";
import OverviewPage from "./pages/dashboard/OverviewPage";
import ConversationsPage from "./pages/dashboard/ConversationsPage";
import BookingsPage from "./pages/dashboard/BookingsPage";
import KnowledgeBasePage from "./pages/dashboard/KnowledgeBasePage";
import BotSettingsPage from "./pages/dashboard/BotSettingsPage";
import ReviewRequestsPage from "./pages/dashboard/ReviewRequestsPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import BillingPage from "./pages/dashboard/BillingPage";
import HelpPage from "./pages/dashboard/HelpPage";
import NotFound from "./pages/NotFound";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/onboarding" element={<ProtectedRoute />}>
              <Route index element={<OnboardingPage />} />
            </Route>

            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="conversations" element={<ConversationsPage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="knowledge" element={<KnowledgeBasePage />} />
                <Route path="settings" element={<BotSettingsPage />} />
                <Route path="reviews" element={<ReviewRequestsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="help" element={<HelpPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
