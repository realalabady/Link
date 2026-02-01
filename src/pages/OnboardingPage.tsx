import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Users are now auto-assigned as CLIENT on signup
    // Redirect based on active role or default to client
    if (user) {
      if (user.activeRole === "PROVIDER") {
        navigate("/provider", { replace: true });
      } else if (user.activeRole === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        // Default: CLIENT or new users
        navigate("/client", { replace: true });
      }
    }
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
};

export default OnboardingPage;
