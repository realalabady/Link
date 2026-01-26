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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Payout, PayoutStatus } from "@/types";

// Extended payout with provider name for display
interface PayoutWithProvider extends Payout {
  providerName?: string;
}

// Query keys
export const payoutKeys = {
  all: ["payouts"] as const,
  byStatus: (status: PayoutStatus) => ["payouts", status] as const,
};

// Mock data store for demo purposes
let mockPayouts: PayoutWithProvider[] = [
  {
    id: "mock-1",
    providerId: "provider-1",
    providerName: "Sarah Ahmed",
    amount: 500,
    status: "REQUESTED" as PayoutStatus,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "mock-2",
    providerId: "provider-2",
    providerName: "Fatima Ali",
    amount: 750,
    status: "APPROVED" as PayoutStatus,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "mock-3",
    providerId: "provider-3",
    providerName: "Noor Hassan",
    amount: 300,
    status: "PAID" as PayoutStatus,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

// Fetch all payouts
export const usePayouts = () => {
  return useQuery<PayoutWithProvider[], Error>({
    queryKey: payoutKeys.all,
    queryFn: async () => {
      try {
        const payoutsRef = collection(db, "payouts");
        const q = query(payoutsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const payouts: PayoutWithProvider[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            providerId: data.providerId || "",
            providerName: data.providerName || "Provider",
            amount: data.amount || 0,
            status: data.status || "REQUESTED",
            createdAt: data.createdAt?.toDate() || new Date(),
            processedAt: data.processedAt?.toDate(),
          };
        });

        // Return real data if exists, otherwise mock data
        if (payouts.length > 0) {
          return payouts;
        }
      } catch (error) {
        console.warn("Error fetching payouts, using mock data:", error);
      }

      // Return mock data
      return mockPayouts;
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
      // Check if this is mock data
      const isMock = payoutId.startsWith("mock-");

      if (isMock) {
        // Update mock data locally
        mockPayouts = mockPayouts.map((p) =>
          p.id === payoutId
            ? {
                ...p,
                status,
                processedAt: status === "PAID" ? new Date() : undefined,
              }
            : p,
        );
        return;
      }

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
