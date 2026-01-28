// React Query hooks for Users (Admin)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, UserStatus } from "@/types";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => ["users", id] as const,
};

// Fetch all users
export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: userKeys.all,
    queryFn: async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const users = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            email: data.email || "",
            name: data.name || "",
            displayName: data.displayName || data.name || "",
            role: data.role || null,
            status: data.status || "ACTIVE",
            phone: data.phone || "",
            region: data.region || "",
            city: data.city || "",
            district: data.district || "",
            notificationsEnabled: data.notificationsEnabled ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as User;
        });

        return users;
      } catch (error) {
        console.warn("Error fetching users:", error);
      }
      return [];
    },
  });
};

// Fetch single user by ID
export const useUser = (userId: string) => {
  return useQuery<User | null, Error>({
    queryKey: userKeys.detail(userId),
    queryFn: async () => {
      if (!userId) return null;

      try {
        const userRef = doc(db, "users", userId);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          return {
            uid: snapshot.id,
            email: data.email || "",
            name: data.name || "",
            displayName: data.displayName || data.name || "",
            role: data.role || null,
            status: data.status || "ACTIVE",
            phone: data.phone || "",
            region: data.region || "",
            city: data.city || "",
            district: data.district || "",
            notificationsEnabled: data.notificationsEnabled ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as User;
        }
      } catch (error) {
        console.warn("Error fetching user:", error);
      }

      return null;
    },
    enabled: !!userId,
  });
};

// Update user status
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: string;
      status: UserStatus;
    }) => {
      // Update real Firestore document
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
