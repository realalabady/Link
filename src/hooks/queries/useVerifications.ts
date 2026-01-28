// React Query hooks for Provider Verifications (Admin)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface VerificationRequest {
  id: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  submittedAt: Date;
  documents: { name: string; url: string }[];
  status: "PENDING" | "APPROVED" | "REJECTED";
}

// Query keys
export const verificationKeys = {
  all: ["verifications"] as const,
  pending: ["verifications", "pending"] as const,
};

// Fetch all verifications
export const usePendingVerifications = () => {
  return useQuery<VerificationRequest[], Error>({
    queryKey: verificationKeys.all,
    queryFn: async () => {
      try {
        // Try to fetch from Firestore first
        const providersRef = collection(db, "providers");
        const snapshot = await getDocs(providersRef);

        const requests: VerificationRequest[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.verificationStatus) {
            requests.push({
              id: doc.id,
              providerId: doc.id,
              providerName: data.displayName || "Provider",
              providerEmail: data.email || "",
              submittedAt: data.createdAt?.toDate() || new Date(),
              documents: data.documents || [],
              status: data.verificationStatus || "PENDING",
            });
          }
        });

        return requests;
      } catch (error) {
        console.warn("Error fetching verifications:", error);
      }
      return [];
    },
  });
};

// Verify/reject a provider
export const useVerifyProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      approved,
      reason,
    }: {
      providerId: string;
      approved: boolean;
      reason?: string;
    }) => {
      // Update real Firestore document
      const providerRef = doc(db, "providers", providerId);
      await updateDoc(providerRef, {
        isVerified: approved,
        verificationStatus: approved ? "APPROVED" : "REJECTED",
        verificationReason: reason || null,
        verifiedAt: approved ? new Date() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.all });
    },
  });
};
