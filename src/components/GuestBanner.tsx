import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGuest } from "@/contexts/GuestContext";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";

export const GuestBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isGuest, exitGuestMode } = useGuest();
  const navigate = useNavigate();

  if (!isGuest) {
    return null;
  }

  const handleSignUp = () => {
    exitGuestMode();
    navigate("/auth/signup");
  };

  const handleLogin = () => {
    exitGuestMode();
    navigate("/auth/login");
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
          <Button size="sm" variant="default" onClick={handleSignUp}>
            {t("auth.signup")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleLogin}>
            {t("auth.login")}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={exitGuestMode}
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
