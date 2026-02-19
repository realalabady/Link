import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useGuest } from "@/contexts/GuestContext";
import { Button } from "@/components/ui/button";
import { UserPlus, X, ArrowLeftRight } from "lucide-react";

export const GuestBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isGuest, exitGuestMode } = useGuest();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isGuest) {
    return null;
  }

  const isProviderView = location.pathname.startsWith("/provider");

  const handleSignUp = () => {
    exitGuestMode();
    navigate("/auth/signup");
  };

  const handleLogin = () => {
    exitGuestMode();
    navigate("/auth/login");
  };

  const handleSwitchView = () => {
    if (isProviderView) {
      navigate("/client");
    } else {
      navigate("/provider");
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-primary/20 bg-primary/10 px-4 py-3">
      <div className="container flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("guest.bannerTitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("guest.bannerDescription")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSwitchView}
            className="gap-1"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isProviderView ? t("guest.viewAsClient") : t("guest.viewAsProvider")}
            </span>
          </Button>
          <Button size="sm" variant="default" onClick={handleSignUp}>
            {t("auth.signup")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleLogin}>
            {t("auth.login")}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              exitGuestMode();
              navigate("/");
            }}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestBanner;
