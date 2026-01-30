// React Query hooks for Payouts (Admin)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Payout, PayoutStatus } from "@/types";

// Extended payout with provider name for display
export interface PayoutWithProvider extends Payout {
  providerName?: string;
  processedAt?: Date;
}

// Query keys
export const payoutKeys = {
  all: ["payouts"] as const,
  byStatus: (status: PayoutStatus) => ["payouts", status] as const,
};

// Fetch all payouts
export const usePayouts = () => {
  return useQuery<PayoutWithProvider[], Error>({
    queryKey: payoutKeys.all,
    queryFn: async () => {
      try {
        const payoutsRef = collection(db, "payouts");
        const q = query(payoutsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const payouts: PayoutWithProvider[] = await Promise.all(
          snapshot.docs.map(async (payoutDoc) => {
            const data = payoutDoc.data();

            // Fetch provider name from users collection first, then providers collection
            let providerName = "Provider";
            if (data.providerId) {
              try {
                // First try users collection (has user.name)
                const userRef = doc(db, "users", data.providerId);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                  providerName =
                    userDoc.data().name ||
                    userDoc.data().displayName ||
                    "Provider";
                }

                // If not found in users, try providers collection
                if (providerName === "Provider") {
                  const providerRef = doc(db, "providers", data.providerId);
                  const providerDoc = await getDoc(providerRef);
                  if (providerDoc.exists()) {
                    providerName =
                      providerDoc.data().name ||
                      providerDoc.data().displayName ||
                      "Provider";
                  }
                }
              } catch (error) {
                console.warn(
                  `Error fetching provider ${data.providerId}:`,
                  error,
                );
              }
            }

            return {
              id: payoutDoc.id,
              providerId: data.providerId || "",
              providerName,
              amount: data.amount || 0,
              status: data.status || "REQUESTED",
              createdAt: data.createdAt?.toDate() || new Date(),
              processedAt: data.processedAt?.toDate(),
            };
          }),
        );

        return payouts;
      } catch (error) {
        console.warn("Error fetching payouts:", error);
      }
      return [];
    },
  });
};

// Process payout (approve, reject, mark paid)
export const useProcessPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payoutId,
      status,
      reason,
    }: {
      payoutId: string;
      status: PayoutStatus;
      reason?: string;
    }) => {
      // Update real Firestore document
      const payoutRef = doc(db, "payouts", payoutId);
      await updateDoc(payoutRef, {
        status,
        rejectionReason: reason || null,
        processedAt: status === "PAID" ? serverTimestamp() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutKeys.all });
    },
  });
};
