// Firestore database helper functions
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  User,
  UserRole,
  UserStatus,
  Category,
  Service,
  ProviderProfile,
  Booking,
  BookingStatus,
  Review,
} from "@/types";

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  PROVIDERS: "providers",
  SERVICES: "services",
  CATEGORIES: "categories",
  BOOKINGS: "bookings",
  CHATS: "chats",
  MESSAGES: "messages",
  REVIEWS: "reviews",
  PAYOUTS: "payouts",
} as const;

// Convert Firestore timestamp to Date
export const timestampToDate = (timestamp: Timestamp | null): Date => {
  return timestamp?.toDate() || new Date();
};

// User document operations
export interface FirestoreUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole | null;
  status: UserStatus;
  phone?: string;
  region?: string;
  city?: string;
  district?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create a new user document in Firestore
export const createUserDocument = async (
  uid: string,
  email: string,
  name: string,
): Promise<User> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);

  const userData: Omit<FirestoreUser, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    uid,
    email,
    name,
    role: null, // Will be set during onboarding
    status: "ACTIVE",
    phone: "",
    region: "",
    city: "",
    district: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, userData);

  return {
    uid,
    email,
    name,
    role: null, // User needs to complete onboarding to set role
    status: "ACTIVE",
    phone: "",
    region: "",
    city: "",
    district: "",
    createdAt: new Date(),
  };
};

// Get user document from Firestore
export const getUserDocument = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  const data = userSnap.data() as FirestoreUser;

  return {
    uid: data.uid,
    email: data.email,
    name: data.name,
    role: data.role, // Can be null if user hasn't completed onboarding
    status: data.status,
    phone: data.phone || "",
    region: data.region || "",
    city: data.city || "",
    district: data.district || "",
    createdAt: timestampToDate(data.createdAt),
  };
};

// Update user role in Firestore
export const updateUserRole = async (
  uid: string,
  role: UserRole,
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });
};

// Update user profile in Firestore
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Pick<User, "name" | "email" | "phone" | "region" | "city" | "district">>,
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Check if user document exists
export const userDocumentExists = async (uid: string): Promise<boolean> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
};

// ============================================
// CATEGORIES
// ============================================

// Default categories to use when Firestore is empty
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "beauty",
    nameEn: "Beauty",
    nameAr: "التجميل",
    icon: "💄",
    isActive: true,
  },
  { id: "hair", nameEn: "Hair", nameAr: "الشعر", icon: "💇", isActive: true },
  {
    id: "nails",
    nameEn: "Nails",
    nameAr: "الأظافر",
    icon: "💅",
    isActive: true,
  },
  {
    id: "skincare",
    nameEn: "Skincare",
    nameAr: "العناية بالبشرة",
    icon: "✨",
    isActive: true,
  },
  {
    id: "massage",
    nameEn: "Massage",
    nameAr: "المساج",
    icon: "💆",
    isActive: true,
  },
  {
    id: "makeup",
    nameEn: "Makeup",
    nameAr: "المكياج",
    icon: "👄",
    isActive: true,
  },
  {
    id: "henna",
    nameEn: "Henna",
    nameAr: "الحناء",
    icon: "🌿",
    isActive: true,
  },
  {
    id: "fitness",
    nameEn: "Fitness",
    nameAr: "اللياقة",
    icon: "🏋️",
    isActive: true,
  },
  {
    id: "photography",
    nameEn: "Photography",
    nameAr: "التصوير",
    icon: "📸",
    isActive: true,
  },
  {
    id: "tailoring",
    nameEn: "Tailoring",
    nameAr: "الخياطة",
    icon: "🧵",
    isActive: true,
  },
  {
    id: "cleaning",
    nameEn: "Cleaning",
    nameAr: "التنظيف",
    icon: "🧹",
    isActive: true,
  },
  {
    id: "cooking",
    nameEn: "Cooking",
    nameAr: "الطبخ",
    icon: "🍳",
    isActive: true,
  },
];

export const getCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const q = query(categoriesRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Return default categories if Firestore is empty
      return DEFAULT_CATEGORIES;
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.warn(
      "Error fetching categories from Firestore, using defaults:",
      error,
    );
    return DEFAULT_CATEGORIES;
  }
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  const categoryRef = doc(db, COLLECTIONS.CATEGORIES, id);
  const categorySnap = await getDoc(categoryRef);

  if (!categorySnap.exists()) return null;

  return { id: categorySnap.id, ...categorySnap.data() } as Category;
};

// ============================================
// PROVIDERS
// ============================================

// Default mock providers for testing when Firestore is empty
export const DEFAULT_PROVIDERS: ProviderProfile[] = [
  {
    uid: "provider-1",
    displayName: "Sara Ahmed",
    bio: "Professional makeup artist with 5+ years of experience",
    region: "Riyadh",
    city: "Riyadh",
    area: "Al Olaya",
    radiusKm: 15,
    isVerified: true,
    ratingAvg: 4.8,
    ratingCount: 124,
    updatedAt: new Date(),
  },
  {
    uid: "provider-2",
    displayName: "Fatima Al-Hassan",
    bio: "Certified hair stylist specializing in bridal looks",
    region: "Makkah",
    city: "Jeddah",
    area: "Al Hamra",
    radiusKm: 20,
    isVerified: true,
    ratingAvg: 4.9,
    ratingCount: 89,
    updatedAt: new Date(),
  },
  {
    uid: "provider-3",
    displayName: "Nora Mohammed",
    bio: "Nail artist and henna specialist",
    region: "Riyadh",
    city: "Riyadh",
    area: "Al Malqa",
    radiusKm: 10,
    isVerified: true,
    ratingAvg: 4.7,
    ratingCount: 56,
    updatedAt: new Date(),
  },
];

export interface FirestoreProviderProfile extends Omit<
  ProviderProfile,
  "updatedAt"
> {
  updatedAt: Timestamp;
}

export const getProviderProfile = async (
  uid: string,
): Promise<ProviderProfile | null> => {
  console.log("getProviderProfile called with uid:", uid);
  try {
    const providerRef = doc(db, COLLECTIONS.PROVIDERS, uid);
    const providerSnap = await getDoc(providerRef);

    if (!providerSnap.exists()) {
      console.log("Provider doc does not exist, checking mocks...");
      // Check if it's a mock provider ID
      const mockProvider = DEFAULT_PROVIDERS.find((p) => p.uid === uid);
      if (mockProvider) {
        console.log("Found mock provider:", mockProvider);
        return mockProvider;
      }

      // Check if the user exists and is a provider - if so, return profile
      const userDoc = await getUserDocument(uid);
      console.log("User doc:", userDoc);
      if (userDoc && userDoc.role === "PROVIDER") {
        // Create a basic provider profile for existing providers
        // Note: user doc may have 'name' or 'displayName' field
        const userName =
          (userDoc as any).name ||
          userDoc.displayName ||
          userDoc.email?.split("@")[0] ||
          "Provider";
        const newProfile: ProviderProfile = {
          uid,
          displayName: userName,
          bio: "",
          region: "",
          city: "",
          area: "",
          isVerified: false,
          ratingAvg: 0,
          ratingCount: 0,
          updatedAt: new Date(),
        };

        // Try to save to Firestore (may fail if current user isn't the provider)
        try {
          await setDoc(providerRef, {
            ...newProfile,
            updatedAt: serverTimestamp(),
          });
          console.log("Created new provider profile:", newProfile);
        } catch (saveError) {
          console.log(
            "Could not save provider profile (permission issue), returning in-memory profile",
          );
        }

        // Return the profile regardless of save success
        return newProfile;
      }

      // If user doc exists but is not a provider, or user doc doesn't exist,
      // create a fallback profile so the page doesn't break
      console.log("Creating fallback profile for uid:", uid);
      const fallbackProfile: ProviderProfile = {
        uid,
        displayName:
          (userDoc as any)?.name ||
          userDoc?.displayName ||
          userDoc?.email?.split("@")[0] ||
          "Provider",
        bio: "",
        city: "",
        area: "",
        isVerified: false,
        ratingAvg: 0,
        ratingCount: 0,
        updatedAt: new Date(),
      };
      return fallbackProfile;
    }

    const data = providerSnap.data() as FirestoreProviderProfile;

    // If displayName is missing or empty, try to get it from user document
    let displayName = data.displayName;
    if (!displayName || displayName.trim() === "") {
      const userDoc = await getUserDocument(uid);
      // Note: user doc may have 'name' or 'displayName' field
      displayName =
        (userDoc as any)?.name ||
        userDoc?.displayName ||
        userDoc?.email?.split("@")[0] ||
        "Provider";

      // Update the provider document with the displayName for future queries
      await setDoc(providerRef, { displayName }, { merge: true });
    }

    return {
      ...data,
      displayName,
      updatedAt: timestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.warn("Error fetching provider, checking mock data:", error);

    // Check mock providers first
    const mockProvider = DEFAULT_PROVIDERS.find((p) => p.uid === uid);
    if (mockProvider) return mockProvider;

    // Try to create profile from user document (handles permission errors)
    try {
      const userDoc = await getUserDocument(uid);
      if (userDoc) {
        const userName =
          (userDoc as any).name ||
          userDoc.displayName ||
          userDoc.email?.split("@")[0] ||
          "Provider";
        const fallbackProfile: ProviderProfile = {
          uid,
          displayName: userName,
          bio: "",
          city: "",
          area: "",
          isVerified: false,
          ratingAvg: 0,
          ratingCount: 0,
          updatedAt: new Date(),
        };
        console.log("Created fallback profile from user doc:", fallbackProfile);
        return fallbackProfile;
      }
    } catch (userError) {
      console.warn("Could not fetch user document:", userError);
    }

    return null;
  }
};

export const getVerifiedProviders = async (
  limitCount = 20,
): Promise<ProviderProfile[]> => {
  try {
    const providersRef = collection(db, COLLECTIONS.PROVIDERS);
    const q = query(
      providersRef,
      where("isVerified", "==", true),
      orderBy("ratingAvg", "desc"),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Return mock providers when Firestore is empty
      return DEFAULT_PROVIDERS.slice(0, limitCount);
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreProviderProfile;
      return {
        ...data,
        updatedAt: timestampToDate(data.updatedAt),
      };
    });
  } catch (error) {
    console.warn("Error fetching providers, using mock data:", error);
    return DEFAULT_PROVIDERS.slice(0, limitCount);
  }
};

export const createProviderProfile = async (
  uid: string,
  profile: Omit<
    ProviderProfile,
    "uid" | "updatedAt" | "ratingAvg" | "ratingCount" | "isVerified"
  >,
): Promise<void> => {
  const providerRef = doc(db, COLLECTIONS.PROVIDERS, uid);
  await setDoc(providerRef, {
    uid,
    ...profile,
    isVerified: false,
    ratingAvg: 0,
    ratingCount: 0,
    updatedAt: serverTimestamp(),
  });
};

export const updateProviderProfile = async (
  uid: string,
  updates: Partial<ProviderProfile>,
): Promise<void> => {
  const providerRef = doc(db, COLLECTIONS.PROVIDERS, uid);
  await updateDoc(providerRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Fix provider displayName by fetching from user document
export const fixProviderDisplayName = async (uid: string): Promise<string> => {
  const userDoc = await getUserDocument(uid);
  const displayName =
    userDoc?.displayName || userDoc?.email?.split("@")[0] || "Provider";

  const providerRef = doc(db, COLLECTIONS.PROVIDERS, uid);
  await setDoc(providerRef, { displayName }, { merge: true });

  console.log(`Fixed provider ${uid} displayName to: ${displayName}`);
  return displayName;
};

// ============================================
// SERVICES
// ============================================

// Default mock services for testing
export const DEFAULT_SERVICES: Service[] = [
  {
    id: "service-1",
    providerId: "provider-1",
    categoryId: "makeup",
    title: "Bridal Makeup",
    description: "Complete bridal makeup with premium products",
    priceFrom: 300,
    priceTo: 500,
    durationMin: 120,
    locationType: "BOTH",
    mediaUrls: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "service-2",
    providerId: "provider-1",
    categoryId: "makeup",
    title: "Party Makeup",
    description: "Glamorous makeup for special occasions",
    priceFrom: 150,
    priceTo: 250,
    durationMin: 60,
    locationType: "BOTH",
    mediaUrls: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "service-3",
    providerId: "provider-2",
    categoryId: "hair",
    title: "Bridal Hair Styling",
    description: "Elegant updos and bridal hairstyles",
    priceFrom: 250,
    priceTo: 400,
    durationMin: 90,
    locationType: "AT_PROVIDER",
    mediaUrls: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "service-4",
    providerId: "provider-2",
    categoryId: "hair",
    title: "Haircut & Blowdry",
    description: "Professional cut and styling",
    priceFrom: 100,
    priceTo: 150,
    durationMin: 45,
    locationType: "AT_PROVIDER",
    mediaUrls: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "service-5",
    providerId: "provider-3",
    categoryId: "nails",
    title: "Gel Manicure",
    description: "Long-lasting gel polish manicure",
    priceFrom: 80,
    priceTo: 120,
    durationMin: 60,
    locationType: "BOTH",
    mediaUrls: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "service-6",
    providerId: "provider-3",
    categoryId: "henna",
    title: "Henna Design",
    description: "Traditional and modern henna art",
    priceFrom: 100,
    priceTo: 300,
    durationMin: 90,
    locationType: "AT_CLIENT",
    mediaUrls: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export interface FirestoreService extends Omit<
  Service,
  "createdAt" | "updatedAt"
> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const getServices = async (filters?: {
  categoryId?: string;
  providerId?: string;
  isActive?: boolean;
}): Promise<Service[]> => {
  try {
    const servicesRef = collection(db, COLLECTIONS.SERVICES);
    let q = query(servicesRef);

    if (filters?.categoryId) {
      q = query(q, where("categoryId", "==", filters.categoryId));
    }
    if (filters?.providerId) {
      q = query(q, where("providerId", "==", filters.providerId));
    }
    if (filters?.isActive !== undefined) {
      q = query(q, where("isActive", "==", filters.isActive));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty && !filters?.providerId) {
      // Return filtered mock services when Firestore is empty
      let mockServices = DEFAULT_SERVICES;
      if (filters?.categoryId) {
        mockServices = mockServices.filter(
          (s) => s.categoryId === filters.categoryId,
        );
      }
      if (filters?.isActive !== undefined) {
        mockServices = mockServices.filter(
          (s) => s.isActive === filters.isActive,
        );
      }
      return mockServices;
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreService;
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      };
    });
  } catch (error) {
    console.warn("Error fetching services, using mock data:", error);
    let mockServices = DEFAULT_SERVICES;
    if (filters?.categoryId) {
      mockServices = mockServices.filter(
        (s) => s.categoryId === filters.categoryId,
      );
    }
    if (filters?.providerId) {
      mockServices = mockServices.filter(
        (s) => s.providerId === filters.providerId,
      );
    }
    if (filters?.isActive !== undefined) {
      mockServices = mockServices.filter(
        (s) => s.isActive === filters.isActive,
      );
    }
    return mockServices;
  }
};

export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const serviceRef = doc(db, COLLECTIONS.SERVICES, id);
    const serviceSnap = await getDoc(serviceRef);

    if (!serviceSnap.exists()) {
      // Check if it's a mock service ID
      const mockService = DEFAULT_SERVICES.find((s) => s.id === id);
      return mockService || null;
    }

    const data = serviceSnap.data() as FirestoreService;
    return {
      ...data,
      id: serviceSnap.id,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.warn("Error fetching service, checking mock data:", error);
    const mockService = DEFAULT_SERVICES.find((s) => s.id === id);
    return mockService || null;
  }
};

export const createService = async (
  service: Omit<Service, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const servicesRef = collection(db, COLLECTIONS.SERVICES);
  const docRef = await addDoc(servicesRef, {
    ...service,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateService = async (
  id: string,
  updates: Partial<Service>,
): Promise<void> => {
  const serviceRef = doc(db, COLLECTIONS.SERVICES, id);
  await updateDoc(serviceRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteService = async (id: string): Promise<void> => {
  const serviceRef = doc(db, COLLECTIONS.SERVICES, id);
  await deleteDoc(serviceRef);
};

// ============================================
// BOOKINGS
// ============================================

export interface FirestoreBooking extends Omit<
  Booking,
  "startAt" | "endAt" | "expiresAt" | "createdAt" | "updatedAt"
> {
  startAt: Timestamp;
  endAt: Timestamp;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const convertFirestoreBooking = (doc: any): Booking => {
  const data = doc.data() as FirestoreBooking;
  return {
    ...data,
    id: doc.id,
    startAt: timestampToDate(data.startAt),
    endAt: timestampToDate(data.endAt),
    expiresAt: data.expiresAt ? timestampToDate(data.expiresAt) : undefined,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
};

export const getBookings = async (filters: {
  clientId?: string;
  providerId?: string;
  status?: BookingStatus;
}): Promise<Booking[]> => {
  try {
    const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);

    // Build query - note: composite indexes required for filter + orderBy
    // If no index exists, we'll catch the error and try without ordering
    let constraints = [];

    if (filters.clientId) {
      constraints.push(where("clientId", "==", filters.clientId));
    }
    if (filters.providerId) {
      constraints.push(where("providerId", "==", filters.providerId));
    }
    if (filters.status) {
      constraints.push(where("status", "==", filters.status));
    }

    // Try with ordering first
    try {
      const q = query(
        bookingsRef,
        ...constraints,
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(convertFirestoreBooking);
    } catch (indexError) {
      // If index error, try without ordering
      console.warn(
        "Composite index not available, fetching without order:",
        indexError,
      );
      const q = query(bookingsRef, ...constraints);
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(convertFirestoreBooking);
      // Sort in memory
      return bookings.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, id);
  const bookingSnap = await getDoc(bookingRef);

  if (!bookingSnap.exists()) return null;

  return convertFirestoreBooking(bookingSnap);
};

export const createBooking = async (
  booking: Omit<Booking, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);

  // Convert Date objects to Firestore-compatible format
  const bookingData = {
    ...booking,
    startAt:
      booking.startAt instanceof Date
        ? booking.startAt
        : new Date(booking.startAt),
    endAt:
      booking.endAt instanceof Date ? booking.endAt : new Date(booking.endAt),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(bookingsRef, bookingData);
  return docRef.id;
};

export const updateBookingStatus = async (
  id: string,
  status: BookingStatus,
): Promise<void> => {
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, id);
  await updateDoc(bookingRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

// ============================================
// REVIEWS
// ============================================

export interface FirestoreReview extends Omit<Review, "createdAt"> {
  createdAt: Timestamp;
}

export const getReviews = async (providerId: string): Promise<Review[]> => {
  const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
  const q = query(
    reviewsRef,
    where("providerId", "==", providerId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as FirestoreReview;
    return {
      ...data,
      id: doc.id,
      createdAt: timestampToDate(data.createdAt),
    };
  });
};

export const createReview = async (
  review: Omit<Review, "id" | "createdAt">,
): Promise<string> => {
  const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
  const docRef = await addDoc(reviewsRef, {
    ...review,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};
