// React Query hooks for Reviews
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviews, createReview } from "@/lib/firestore";
import { Review } from "@/types";
import { providerKeys } from "./useProviders";

// Query keys for cache management
export const reviewKeys = {
  all: ["reviews"] as const,
  byProvider: (providerId: string) =>
    ["reviews", "provider", providerId] as const,
  byService: (serviceId: string) => ["reviews", "service", serviceId] as const,
};

// Fetch reviews with optional filters
export const useReviews = (filters?: {
  providerId?: string;
  serviceId?: string;
}) => {
  const providerId = filters?.providerId;
  return useQuery<Review[], Error>({
    queryKey: providerId ? reviewKeys.byProvider(providerId) : reviewKeys.all,
    queryFn: () => getReviews(providerId || ""),
    enabled: !!providerId,
  });
};

// Fetch reviews for a provider
export const useProviderReviews = (providerId: string) => {
  return useQuery<Review[], Error>({
    queryKey: reviewKeys.byProvider(providerId),
    queryFn: () => getReviews(providerId),
    enabled: !!providerId,
  });
};

// Create a new review
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (review: Omit<Review, "id" | "createdAt">) =>
      createReview(review),
    onSuccess: (_, variables) => {
      // Invalidate provider reviews list
      queryClient.invalidateQueries({
        queryKey: reviewKeys.byProvider(variables.providerId),
      });
      // Also invalidate provider profile to update rating
      queryClient.invalidateQueries({
        queryKey: providerKeys.detail(variables.providerId),
      });
    },
  });
};
