// React Query hooks for Categories
import { useQuery } from "@tanstack/react-query";
import { getCategories, getCategoryById } from "@/lib/firestore";
import { Category } from "@/types";

// Query keys for cache management
export const categoryKeys = {
  all: ["categories"] as const,
  detail: (id: string) => ["categories", id] as const,
};

// Fetch all active categories
export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: categoryKeys.all,
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // Categories rarely change, cache for 10 minutes
  });
};

// Fetch a single category by ID
export const useCategory = (id: string) => {
  return useQuery<Category | null, Error>({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: !!id,
  });
};
