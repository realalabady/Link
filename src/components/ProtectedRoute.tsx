import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  allowGuest?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
  allowGuest = false,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isGuest } = useGuest();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Allow guest access if allowGuest is true and user is in guest mode
  if (allowGuest && isGuest) {
    return <>{children}</>;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if user has any of the allowed roles in their roles array
  if (allowedRoles && user) {
    const hasAllowedRole = allowedRoles.some((role) =>
      user.roles?.includes(role),
    );

    if (!hasAllowedRole) {
      // Redirect based on active role
      if (user.activeRole === "CLIENT") {
        return <Navigate to="/client" replace />;
      } else if (user.activeRole === "PROVIDER") {
        return <Navigate to="/provider" replace />;
      } else if (user.activeRole === "ADMIN") {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
