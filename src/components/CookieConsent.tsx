import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";

const COOKIE_NAME = "link_cookie_consent";
const COOKIE_MAX_AGE = 180; // days

const storeLocation = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const payload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };
      localStorage.setItem("link_location", JSON.stringify(payload));
    },
    () => {
      // Ignore location errors
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 600000 },
  );
};

const CookieConsent: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = Cookies.get(COOKIE_NAME);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    Cookies.set(COOKIE_NAME, "accepted", { expires: COOKIE_MAX_AGE });
    storeLocation();
    setIsVisible(false);
  };

  const handleDecline = () => {
    Cookies.set(COOKIE_NAME, "declined", { expires: COOKIE_MAX_AGE });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur md:left-auto md:right-6 md:w-[420px]">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t("common.cookieTitle")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("common.cookieDescription")}
          </p>
        </div>

        {showDetails && (
          <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">
              {t("common.cookieDetailsTitle")}
            </p>
            <ul className="space-y-1">
              <li>link_cookie_consent</li>
              <li>link_location</li>
              <li>sidebar:state</li>
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleAccept}>
            {t("common.accept")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDecline}>
            {t("common.decline")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? t("common.hideCookies") : t("common.viewCookies")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
