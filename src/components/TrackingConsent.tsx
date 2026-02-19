import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const TRACKING_CONSENT_KEY = "tracking_consent";

type ConsentStatus = "granted" | "denied" | "pending";

export const useTrackingConsent = () => {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(() => {
    const stored = localStorage.getItem(TRACKING_CONSENT_KEY);
    return (stored as ConsentStatus) || "pending";
  });

  const grantConsent = () => {
    localStorage.setItem(TRACKING_CONSENT_KEY, "granted");
    setConsentStatus("granted");
    // Here you would initialize analytics/tracking
    console.log("Tracking consent granted");
  };

  const denyConsent = () => {
    localStorage.setItem(TRACKING_CONSENT_KEY, "denied");
    setConsentStatus("denied");
    // Here you would disable analytics/tracking
    console.log("Tracking consent denied");
  };

  return { consentStatus, grantConsent, denyConsent };
};

export const TrackingConsent: React.FC = () => {
  const { t } = useTranslation();
  const { consentStatus, grantConsent, denyConsent } = useTrackingConsent();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show dialog only if consent is pending and user hasn't made a choice
    if (consentStatus === "pending") {
      // Small delay to let the app render first
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [consentStatus]);

  const handleAllow = () => {
    grantConsent();
    setIsOpen(false);
  };

  const handleDeny = () => {
    denyConsent();
    setIsOpen(false);
  };

  if (consentStatus !== "pending") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {t("tracking.title")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("tracking.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">
            {t("tracking.whatWeCollect")}
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>{t("tracking.item1")}</li>
            <li>{t("tracking.item2")}</li>
            <li>{t("tracking.item3")}</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={handleAllow} className="w-full">
            {t("tracking.allow")}
          </Button>
          <Button variant="outline" onClick={handleDeny} className="w-full">
            {t("tracking.deny")}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("tracking.changeAnytime")}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default TrackingConsent;
