// React Query hooks for Subscription Settings
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptionSettings,
  updateSubscriptionSettings,
  SubscriptionSettings,
  SubscriptionPlan,
} from "@/lib/firestore";

export type { SubscriptionSettings, SubscriptionPlan };

export const subscriptionSettingsKeys = {
  all: ["subscriptionSettings"] as const,
};

// Fetch subscription settings
export const useSubscriptionSettings = () => {
  return useQuery<SubscriptionSettings, Error>({
    queryKey: subscriptionSettingsKeys.all,
    queryFn: getSubscriptionSettings,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Update subscription settings mutation
export const useUpdateSubscriptionSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<SubscriptionSettings>) =>
      updateSubscriptionSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionSettingsKeys.all });
    },
  });
};
