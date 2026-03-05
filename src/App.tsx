import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import { AdminSettings } from "./pages/AdminSettings";
import CreatePost from "./pages/CreatePost";
import CreateAd from "./pages/CreateAd";
import PendingApprovals from "./pages/PendingApprovals";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AttentionRequired from "./pages/AttentionRequired";
import CustomerTestimonial from "./pages/CustomerTestimonial";
import NotFound from "./pages/NotFound";
import { PricingPlans } from "./pages/PricingPlans";
import Success from "./pages/Success";
import { ManageBusinesses } from "./pages/ManageBusinesses";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SubscriptionGate } from "@/components/auth/SubscriptionGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><SubscriptionGate><AdminDashboard /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/create-post" element={<ProtectedRoute><SubscriptionGate><CreatePost /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/create-ad" element={<ProtectedRoute><SubscriptionGate><CreateAd /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute><SubscriptionGate><PendingApprovals /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><SubscriptionGate><Schedule /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><SubscriptionGate><Analytics /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SubscriptionGate><Settings /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionGate><AdminSettings /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/admin/businesses" element={<ProtectedRoute><SubscriptionGate><ManageBusinesses /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/attention" element={<ProtectedRoute><SubscriptionGate><AttentionRequired /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/testimonial" element={<ProtectedRoute><SubscriptionGate><CustomerTestimonial /></SubscriptionGate></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><SubscriptionGate><AdminDashboard /></SubscriptionGate></ProtectedRoute>} />

              {/* Accessible without an active subscription */}
              <Route path="/pricing" element={<PricingPlans />} />
              <Route path="/success" element={<Success />} />

              <Route path="/forgot-password" element={<Login />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
