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

// Mock data store for demo purposes
let mockUsers: User[] = [
  {
    uid: "mock-user-1",
    email: "client@example.com",
    name: "Amira Hassan",
    role: "CLIENT",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    uid: "mock-user-2",
    email: "provider@example.com",
    name: "Fatima Salem",
    role: "PROVIDER",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
  },
  {
    uid: "mock-user-3",
    email: "suspended@example.com",
    name: "Noor Ahmed",
    role: "CLIENT",
    status: "SUSPENDED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
];

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
            role: data.role || null,
            status: data.status || "ACTIVE",
            createdAt: data.createdAt?.toDate() || new Date(),
          } as User;
        });

        // Return real data if exists, otherwise mock data
        if (users.length > 0) {
          return users;
        }
      } catch (error) {
        console.warn("Error fetching users, using mock data:", error);
      }

      // Return mock data
      return mockUsers;
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
            role: data.role || null,
            status: data.status || "ACTIVE",
            createdAt: data.createdAt?.toDate() || new Date(),
          } as User;
        }
      } catch (error) {
        console.warn("Error fetching user:", error);
      }

      // Check mock data
      const mockUser = mockUsers.find((u) => u.uid === userId);
      return mockUser || null;
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
      // Check if this is mock data
      const isMock = userId.startsWith("mock-");

      if (isMock) {
        // Update mock data locally
        mockUsers = mockUsers.map((u) =>
          u.uid === userId ? { ...u, status } : u,
        );
        return;
      }

      // Update real Firestore document
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
