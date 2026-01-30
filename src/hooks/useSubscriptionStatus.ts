import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderProfile } from "./queries/useProviders";
import { ProviderProfile } from "@/types";

interface SubscriptionStatus {
  isLocked: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  profile: ProviderProfile | null;
  isLoading: boolean;
}

/**
 * Hook to check provider's subscription and account status
 * Returns whether account is locked and days until expiration
 */
export const useSubscriptionStatus = (): SubscriptionStatus => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProviderProfile(user?.uid || "");
  const [status, setStatus] = useState<SubscriptionStatus>({
    isLocked: false,
    isExpired: false,
    daysUntilExpiry: -1,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!profile) {
      setStatus({
        isLocked: false,
        isExpired: false,
        daysUntilExpiry: -1,
        profile: null,
        isLoading,
      });
      return;
    }

    const isLocked = profile.accountStatus === "LOCKED";
    const isExpired =
      profile.subscriptionStatus === "EXPIRED" ||
      profile.subscriptionStatus === "CANCELLED";

    let daysUntilExpiry = -1;
    if (profile.subscriptionEndDate) {
      const today = new Date();
      const endDate = new Date(profile.subscriptionEndDate);
      daysUntilExpiry = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    setStatus({
      isLocked,
      isExpired,
      daysUntilExpiry,
      profile,
      isLoading,
    });
  }, [profile, isLoading]);

  return status;
};
