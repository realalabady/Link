// React Query hooks for Banner Settings
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBannerSettings, updateBannerSettings } from "@/lib/firestore";
import { BannerSettings } from "@/types";

export const bannerKeys = {
  all: ["banner"] as const,
};

// Fetch banner settings
export const useBanner = () => {
  return useQuery<BannerSettings, Error>({
    queryKey: bannerKeys.all,
    queryFn: getBannerSettings,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Update banner settings mutation
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
