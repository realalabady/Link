import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Layouts
import { ClientLayout } from "@/components/layout/ClientLayout";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import OnboardingPage from "@/pages/OnboardingPage";
import NotFound from "@/pages/NotFound";

// Client pages
import ClientHomePage from "@/pages/client/ClientHomePage";
import {
  ClientSearchPage,
  ClientBookingsPage,
  ClientChatsPage,
  ClientProfilePage,
} from "@/pages/placeholders";

// Provider pages
import ProviderDashboardPage from "@/pages/provider/ProviderDashboardPage";
import {
  ProviderServicesPage,
  ProviderSchedulePage,
  ProviderChatsPage,
  ProviderWalletPage,
} from "@/pages/placeholders";

// Admin pages
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import {
  AdminUsersPage,
  AdminVerificationsPage,
  AdminPayoutsPage,
} from "@/pages/placeholders";

const queryClient = new QueryClient();

// Root redirect based on user role
const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <LandingPage />;
  }
  
  if (user?.role === 'CLIENT') {
    return <Navigate to="/client" replace />;
  } else if (user?.role === 'PROVIDER') {
    return <Navigate to="/provider" replace />;
  } else if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/onboarding" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      
      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      
      {/* Client routes */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientHomePage />} />
        <Route path="search" element={<ClientSearchPage />} />
        <Route path="bookings" element={<ClientBookingsPage />} />
        <Route path="chats" element={<ClientChatsPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
      </Route>
      
      {/* Provider routes */}
      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRoles={['PROVIDER']}>
            <ProviderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProviderDashboardPage />} />
        <Route path="services" element={<ProviderServicesPage />} />
        <Route path="schedule" element={<ProviderSchedulePage />} />
        <Route path="chats" element={<ProviderChatsPage />} />
        <Route path="wallet" element={<ProviderWalletPage />} />
      </Route>
      
      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="verifications" element={<AdminVerificationsPage />} />
        <Route path="payouts" element={<AdminPayoutsPage />} />
      </Route>
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
