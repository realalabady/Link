// React Query hooks for Banner Settings
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBannerSettings,
  updateBannerSettings,
  getProviderBannerSettings,
  updateProviderBannerSettings,
} from "@/lib/firestore";
import { BannerSettings, ProviderBannerSettings } from "@/types";

export const bannerKeys = {
  all: ["banner"] as const,
  provider: ["provider-banner"] as const,
};

// Fetch banner settings (for clients)
export const useBanner = () => {
  return useQuery<BannerSettings, Error>({
    queryKey: bannerKeys.all,
    queryFn: getBannerSettings,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Update banner settings mutation (for clients)
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<BannerSettings>) =>
      updateBannerSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
    },
  });
};

// Fetch provider banner settings
export const useProviderBanner = () => {
  return useQuery<ProviderBannerSettings, Error>({
    queryKey: bannerKeys.provider,
    queryFn: getProviderBannerSettings,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Update provider banner settings mutation
export const useUpdateProviderBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<ProviderBannerSettings>) =>
      updateProviderBannerSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.provider });
    },
  });
};
