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
import ClientSearchPage from "@/pages/client/ClientSearchPage";
import ClientBookingsPage from "@/pages/client/ClientBookingsPage";
import ClientChatsPage from "@/pages/client/ClientChatsPage";
import ClientChatRoomPage from "@/pages/client/ClientChatRoomPage";
import ClientProfilePage from "@/pages/client/ClientProfilePage";
import ProviderProfilePage from "@/pages/client/ProviderProfilePage";
import BookingPage from "@/pages/client/BookingPage";
import BookingDetailsPage from "@/pages/client/BookingDetailsPage";

// Provider pages
import ProviderDashboardPage from "@/pages/provider/ProviderDashboardPage";
import ProviderServicesPage from "@/pages/provider/ProviderServicesPage";
import ProviderSchedulePage from "@/pages/provider/ProviderSchedulePage";
import ProviderChatsPage from "@/pages/provider/ProviderChatsPage";
import ProviderChatRoomPage from "@/pages/provider/ProviderChatRoomPage";
import ProviderWalletPage from "@/pages/provider/ProviderWalletPage";
import ProviderBookingDetailsPage from "@/pages/provider/ProviderBookingDetailsPage";

// Admin pages
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminVerificationsPage from "@/pages/admin/AdminVerificationsPage";
import AdminPayoutsPage from "@/pages/admin/AdminPayoutsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache kept for 30 minutes
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    },
  },
});

// Root redirect based on user role
const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (user?.role === "CLIENT") {
    return <Navigate to="/client" replace />;
  } else if (user?.role === "PROVIDER") {
    return <Navigate to="/provider" replace />;
  } else if (user?.role === "ADMIN") {
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
          <ProtectedRoute allowedRoles={["CLIENT"]}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientHomePage />} />
        <Route path="search" element={<ClientSearchPage />} />
        <Route path="bookings" element={<ClientBookingsPage />} />
        <Route path="bookings/:bookingId" element={<BookingDetailsPage />} />
        <Route path="chats" element={<ClientChatsPage />} />
        <Route path="chats/:chatId" element={<ClientChatRoomPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
        <Route path="provider/:id" element={<ProviderProfilePage />} />
        <Route path="book/:serviceId" element={<BookingPage />} />
      </Route>

      {/* Provider routes */}
      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRoles={["PROVIDER"]}>
            <ProviderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProviderDashboardPage />} />
        <Route path="booking/:bookingId" element={<ProviderBookingDetailsPage />} />
        <Route path="services" element={<ProviderServicesPage />} />
        <Route path="schedule" element={<ProviderSchedulePage />} />
        <Route path="chats" element={<ProviderChatsPage />} />
        <Route path="chats/:chatId" element={<ProviderChatRoomPage />} />
        <Route path="wallet" element={<ProviderWalletPage />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
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
