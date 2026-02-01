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
  writeBatch,
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
  Payment,
  BannerSettings,
} from "@/types";

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  PROVIDERS: "providers",
  SERVICES: "services",
  CATEGORIES: "categories",
  BOOKINGS: "bookings",
  PAYMENTS: "payments",
  CHATS: "chats",
  MESSAGES: "messages",
  REVIEWS: "reviews",
  PAYOUTS: "payouts",
  SETTINGS: "settings",
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
  displayName?: string;
  roles: UserRole[]; // Array of roles user has access to
  activeRole: UserRole | null; // Currently active role
  // Legacy field for backward compatibility
  role?: UserRole | null;
  status: UserStatus;
  phone?: string;
  region?: string;
  city?: string;
  district?: string;
  notificationsEnabled?: boolean;
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
    displayName: name,
    roles: ["CLIENT"], // New users start as CLIENT
    activeRole: "CLIENT", // Default active role
    status: "ACTIVE",
    phone: "",
    region: "",
    city: "",
    district: "",
    notificationsEnabled: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, userData);

  return {
    uid,
    email,
    name,
    roles: ["CLIENT"],
    activeRole: "CLIENT",
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

  // Handle backward compatibility: migrate old role to roles array
  let roles: UserRole[] = data.roles || [];
  let activeRole: UserRole | null = data.activeRole || null;

  // If user has old single role but no roles array, migrate
  if (roles.length === 0 && data.role) {
    roles = [data.role];
    activeRole = data.role;
    // Migrate in background (don't await to avoid blocking)
    updateDoc(userRef, {
      roles,
      activeRole,
      updatedAt: serverTimestamp(),
    }).catch(console.error);
  }

  return {
    uid: data.uid,
    email: data.email,
    name: data.name,
    roles,
    activeRole,
    status: data.status,
    phone: data.phone || "",
    region: data.region || "",
    city: data.city || "",
    district: data.district || "",
    notificationsEnabled: data.notificationsEnabled ?? true,
    createdAt: timestampToDate(data.createdAt),
  };
};

// Update user role in Firestore (legacy - kept for compatibility)
export const updateUserRole = async (
  uid: string,
  role: UserRole,
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, {
    role,
    activeRole: role,
    updatedAt: serverTimestamp(),
  });
};

// Switch active role (when user has multiple roles)
export const switchActiveRole = async (
  uid: string,
  role: UserRole,
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, {
    activeRole: role,
    updatedAt: serverTimestamp(),
  });
};

// Add a new role to user's roles array
export const addRoleToUser = async (
  uid: string,
  newRole: UserRole,
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User not found");
  }

  const data = userSnap.data();
  const currentRoles: UserRole[] = data.roles || [];

  // Only add if not already present
  if (!currentRoles.includes(newRole)) {
    await updateDoc(userRef, {
      roles: [...currentRoles, newRole],
      activeRole: newRole, // Switch to new role
      updatedAt: serverTimestamp(),
    });
  }
};

// Update user profile in Firestore
export const updateUserProfile = async (
  uid: string,
  updates: Partial<
    Pick<
      User,
      | "name"
      | "email"
      | "phone"
      | "region"
      | "city"
      | "district"
      | "notificationsEnabled"
    >
  >,
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
// Women-focused services marketplace
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "makeup",
    nameEn: "Makeup",
    nameAr: "المكياج",
    icon: "Palette",
    isActive: true,
  },
  {
    id: "hair",
    nameEn: "Hair Styling",
    nameAr: "تصفيف الشعر",
    icon: "Scissors",
    isActive: true,
  },
  {
    id: "nails",
    nameEn: "Nails",
    nameAr: "الأظافر",
    icon: "Sparkles",
    isActive: true,
  },
  {
    id: "skincare",
    nameEn: "Skincare",
    nameAr: "العناية بالبشرة",
    icon: "Droplets",
    isActive: true,
  },
  {
    id: "spa",
    nameEn: "Spa & Relaxation",
    nameAr: "السبا والاسترخاء",
    icon: "Flower2",
    isActive: true,
  },
  {
    id: "massage",
    nameEn: "Massage",
    nameAr: "المساج",
    icon: "Hand",
    isActive: true,
  },
  {
    id: "henna",
    nameEn: "Henna",
    nameAr: "الحناء",
    icon: "Leaf",
    isActive: true,
  },
  {
    id: "waxing",
    nameEn: "Hair Removal",
    nameAr: "إزالة الشعر",
    icon: "Star",
    isActive: true,
  },
  {
    id: "lashes",
    nameEn: "Lashes & Brows",
    nameAr: "الرموش والحواجب",
    icon: "Eye",
    isActive: true,
  },
  {
    id: "aesthetics",
    nameEn: "Medical Aesthetics",
    nameAr: "التجميل الطبي",
    icon: "Syringe",
    isActive: true,
  },
  {
    id: "bridal",
    nameEn: "Bridal Services",
    nameAr: "خدمات العروس",
    icon: "Crown",
    isActive: true,
  },
  {
    id: "yoga",
    nameEn: "Yoga & Pilates",
    nameAr: "اليوغا والبيلاتس",
    icon: "Heart",
    isActive: true,
  },
  {
    id: "fitness",
    nameEn: "Women's Fitness",
    nameAr: "لياقة نسائية",
    icon: "Dumbbell",
    isActive: true,
  },
  {
    id: "nutrition",
    nameEn: "Nutrition & Diet",
    nameAr: "التغذية والحمية",
    icon: "Apple",
    isActive: true,
  },
  {
    id: "photography",
    nameEn: "Photography",
    nameAr: "التصوير",
    icon: "Camera",
    isActive: true,
  },
  {
    id: "tailoring",
    nameEn: "Tailoring & Alterations",
    nameAr: "الخياطة والتعديلات",
    icon: "Shirt",
    isActive: true,
  },
  {
    id: "personal_shopping",
    nameEn: "Personal Shopping",
    nameAr: "التسوق الشخصي",
    icon: "ShoppingBag",
    isActive: true,
  },
  {
    id: "events",
    nameEn: "Event Planning",
    nameAr: "تنظيم الفعاليات",
    icon: "PartyPopper",
    isActive: true,
  },
  {
    id: "cooking",
    nameEn: "Cooking & Catering",
    nameAr: "الطبخ والتموين",
    icon: "ChefHat",
    isActive: true,
  },
  {
    id: "childcare",
    nameEn: "Childcare",
    nameAr: "رعاية الأطفال",
    icon: "Baby",
    isActive: true,
  },
  {
    id: "tutoring",
    nameEn: "Tutoring",
    nameAr: "دروس خصوصية",
    icon: "BookOpen",
    isActive: true,
  },
  {
    id: "cleaning",
    nameEn: "Home Cleaning",
    nameAr: "تنظيف المنزل",
    icon: "Home",
    isActive: true,
  },
  {
    id: "organizing",
    nameEn: "Home Organizing",
    nameAr: "تنظيم المنزل",
    icon: "FolderOpen",
    isActive: true,
  },
];

export const seedDefaultCategories = async (): Promise<void> => {
  const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
  const snapshot = await getDocs(query(categoriesRef, limit(1)));
  if (!snapshot.empty) return;

  const batch = writeBatch(db);
  DEFAULT_CATEGORIES.forEach((category) => {
    const categoryRef = doc(db, COLLECTIONS.CATEGORIES, category.id);
    batch.set(categoryRef, {
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      isActive: category.isActive,
      icon: category.icon || "",
      parentId: category.parentId || null,
    });
  });

  await batch.commit();
};

// Force reseed all categories (replaces existing ones but preserves imageUrl)
export const forceReseedCategories = async (): Promise<void> => {
  const batch = writeBatch(db);

  // First, get existing categories to preserve their imageUrl
  const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
  const existingSnapshot = await getDocs(categoriesRef);
  
  // Create a map of existing category imageUrls
  const existingImages: Record<string, string> = {};
  existingSnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.imageUrl) {
      existingImages[docSnap.id] = data.imageUrl;
    }
    // Deactivate categories not in DEFAULT_CATEGORIES
    if (!DEFAULT_CATEGORIES.some(c => c.id === docSnap.id)) {
      batch.update(docSnap.ref, { isActive: false });
    }
  });

  // Then add/update all default categories, preserving imageUrl
  DEFAULT_CATEGORIES.forEach((category) => {
    const categoryRef = doc(db, COLLECTIONS.CATEGORIES, category.id);
    batch.set(
      categoryRef,
      {
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        isActive: category.isActive,
        icon: category.icon || "",
        parentId: category.parentId || null,
        // Preserve existing imageUrl if it exists
        ...(existingImages[category.id] && { imageUrl: existingImages[category.id] }),
      },
      { merge: true },
    );
  });

  await batch.commit();
  console.log("Categories reseeded successfully!");
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const q = query(categoriesRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);

    if (snapshot.docs.length === 0) {
      console.info("No categories in Firestore, using mock data");
      return DEFAULT_CATEGORIES;
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.warn("Error fetching categories from Firestore:", error);
    return DEFAULT_CATEGORIES;
  }
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  const categoryRef = doc(db, COLLECTIONS.CATEGORIES, id);
  const categorySnap = await getDoc(categoryRef);

  if (!categorySnap.exists()) return null;

  return { id: categorySnap.id, ...categorySnap.data() } as Category;
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const snapshot = await getDocs(categoriesRef);

    if (snapshot.docs.length === 0) {
      return DEFAULT_CATEGORIES;
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.warn("Error fetching all categories:", error);
    return DEFAULT_CATEGORIES;
  }
};

export const createCategory = async (
  category: Omit<Category, "id">,
): Promise<string> => {
  const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
  const docRef = await addDoc(categoriesRef, category);
  return docRef.id;
};

export const updateCategory = async (
  id: string,
  updates: Partial<Omit<Category, "id">>,
): Promise<void> => {
  const categoryRef = doc(db, COLLECTIONS.CATEGORIES, id);
  await updateDoc(categoryRef, updates);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categoryRef = doc(db, COLLECTIONS.CATEGORIES, id);
  await deleteDoc(categoryRef);
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
    latitude: 24.7136,
    longitude: 46.6753,
    radiusKm: 15,
    isVerified: true,
    ratingAvg: 4.8,
    ratingCount: 124,
    updatedAt: new Date(),
    isSubscribed: true,
    subscriptionStatus: "ACTIVE",
    accountStatus: "ACTIVE",
  },
  {
    uid: "provider-2",
    displayName: "Fatima Al-Hassan",
    bio: "Certified hair stylist specializing in bridal looks",
    region: "Makkah",
    city: "Jeddah",
    area: "Al Hamra",
    latitude: 21.4858,
    longitude: 39.1925,
    radiusKm: 20,
    isVerified: true,
    ratingAvg: 4.9,
    ratingCount: 89,
    updatedAt: new Date(),
    isSubscribed: true,
    subscriptionStatus: "ACTIVE",
    accountStatus: "ACTIVE",
  },
  {
    uid: "provider-3",
    displayName: "Nora Mohammed",
    bio: "Nail artist and henna specialist",
    region: "Riyadh",
    city: "Riyadh",
    area: "Al Malqa",
    latitude: 24.8103,
    longitude: 46.6766,
    radiusKm: 10,
    isVerified: true,
    ratingAvg: 4.7,
    ratingCount: 56,
    updatedAt: new Date(),
    isSubscribed: true,
    subscriptionStatus: "ACTIVE",
    accountStatus: "ACTIVE",
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
  try {
    const providerRef = doc(db, COLLECTIONS.PROVIDERS, uid);
    const providerSnap = await getDoc(providerRef);

    if (!providerSnap.exists()) {
      // Check if the user exists and is a provider - if so, return profile
      const userDoc = await getUserDocument(uid);
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
          isSubscribed: false,
          subscriptionStatus: "EXPIRED",
          accountStatus: "ACTIVE",
        };

        // Try to save to Firestore (may fail if current user isn't the provider)
        try {
          await setDoc(providerRef, {
            ...newProfile,
            updatedAt: serverTimestamp(),
          });
        } catch (saveError) {
          console.log(
            "Could not save provider profile (permission issue), returning in-memory profile",
          );
        }

        // Return the profile regardless of save success
        return newProfile;
      }

      return null;
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
    console.warn("Error fetching provider:", error);
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

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreProviderProfile;
      return {
        ...data,
        updatedAt: timestampToDate(data.updatedAt),
      };
    });
  } catch (error) {
    console.warn("Error fetching providers:", error);
    return [];
  }
};

export const createProviderProfile = async (
  uid: string,
  profile: Omit<
    ProviderProfile,
    | "uid"
    | "updatedAt"
    | "ratingAvg"
    | "ratingCount"
    | "isVerified"
    | "isSubscribed"
    | "subscriptionStatus"
    | "accountStatus"
  >,
): Promise<void> => {
  const providerRef = doc(db, COLLECTIONS.PROVIDERS, uid);
  await setDoc(providerRef, {
    uid,
    ...profile,
    isVerified: false,
    ratingAvg: 0,
    ratingCount: 0,
    // Subscription initialization
    isSubscribed: false,
    subscriptionStatus: "EXPIRED",
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    subscriptionPrice: 10, // SAR per month
    autoRenew: false,
    cancellationDate: null,
    accountStatus: "ACTIVE",
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

// Verify subscription payment (admin marks as paid)
export const verifySubscriptionPayment = async (
  providerId: string,
  paymentData?: {
    date?: Date;
    amount?: number;
    method?: "BANK_TRANSFER" | "CARD" | "OTHER";
    notes?: string;
  },
): Promise<void> => {
  const now = new Date();
  const providerRef = doc(db, COLLECTIONS.PROVIDERS, providerId);
  const profile = await getProviderProfile(providerId);

  if (!profile) {
    throw new Error("Provider profile not found");
  }

  // Calculate new subscription end date based on plan
  let endDate = new Date(now);

  // Map price to months: 10=1 month, 27=3 months, 96=12 months
  const priceToMonths: Record<number, number> = {
    10: 1,
    27: 3,
    96: 12,
  };

  const currentPrice = profile.subscriptionPrice || 10;
  const months = priceToMonths[currentPrice] || 1;
  endDate.setMonth(endDate.getMonth() + months);

  await updateDoc(providerRef, {
    subscriptionStatus: "ACTIVE",
    subscriptionStartDate: serverTimestamp(),
    subscriptionEndDate: endDate,
    lastPaymentDate: serverTimestamp(),
    paymentVerificationStatus: "VERIFIED",
    paymentNotes: paymentData?.notes || "Payment verified by admin",
    accountStatus: "ACTIVE", // Unlock account if was locked
    // New payment tracking fields
    lastSubscriptionPaymentDate: paymentData?.date || now,
    lastSubscriptionPaymentAmount: paymentData?.amount || currentPrice,
    lastSubscriptionPaymentMethod: paymentData?.method || "BANK_TRANSFER",
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
};

// Update subscription status manually (admin action)
export const updateSubscriptionStatus = async (
  providerId: string,
  status: "ACTIVE" | "EXPIRED" | "CANCELLED",
  startDate?: Date,
  endDate?: Date,
  price?: number,
): Promise<void> => {
  const providerRef = doc(db, COLLECTIONS.PROVIDERS, providerId);
  const updates: Record<string, unknown> = {
    subscriptionStatus: status,
    updatedAt: serverTimestamp(),
  };

  if (startDate) updates.subscriptionStartDate = startDate;
  if (endDate) updates.subscriptionEndDate = endDate;
  if (price) updates.subscriptionPrice = price;

  if (status === "CANCELLED") {
    updates.cancellationDate = new Date();
  }

  await updateDoc(providerRef, updates);
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
  {
    id: "service-cooking-1",
    providerId: "provider-1",
    categoryId: "cooking",
    title: "Home Cooking",
    description: "Delicious home-cooked meals prepared at your place.",
    priceFrom: 80,
    priceTo: 200,
    durationMin: 120,
    locationType: "AT_CLIENT",
    mediaUrls: ["/assets/services/cooking1.jpg"],
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

    if (snapshot.docs.length === 0 && !filters) {
      console.info("No services in Firestore, using mock data");
      return DEFAULT_SERVICES;
    }

    const services = snapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreService;
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      };
    });

    // Filter out services from locked providers (don't show to clients)
    // If filtering by specific provider ID, skip this check (provider sees own services)
    if (!filters?.providerId) {
      const lockedServiceIds = new Set<string>();

      // Fetch provider profiles to check account status
      for (const service of services) {
        try {
          const providerProfile = await getProviderProfile(service.providerId);
          if (providerProfile?.accountStatus === "LOCKED") {
            lockedServiceIds.add(service.id);
          }
        } catch (error) {
          // Silent fail - if we can't fetch profile, include the service
        }
      }

      return services.filter((s) => !lockedServiceIds.has(s.id));
    }

    return services;
  } catch (error) {
    console.warn("Error fetching services:", error);
    if (!filters) {
      return DEFAULT_SERVICES;
    }
    return [];
  }
};

export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const serviceRef = doc(db, COLLECTIONS.SERVICES, id);
    const serviceSnap = await getDoc(serviceRef);

    if (!serviceSnap.exists()) {
      return null;
    }

    const data = serviceSnap.data() as FirestoreService;
    return {
      ...data,
      id: serviceSnap.id,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.warn("Error fetching service:", error);
    return null;
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
// PAYMENTS
// ============================================

export const createPayment = async (
  payment: Omit<Payment, "id" | "createdAt">,
): Promise<string> => {
  const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);
  const docRef = await addDoc(paymentsRef, {
    ...payment,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updatePayment = async (
  id: string,
  updates: Partial<Payment>,
): Promise<void> => {
  const paymentRef = doc(db, COLLECTIONS.PAYMENTS, id);
  await updateDoc(paymentRef, {
    ...updates,
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

// ============================================
// BANNER SETTINGS
// ============================================

const DEFAULT_BANNER: BannerSettings = {
  isActive: false,
  titleEn: "Welcome to Link",
  titleAr: "مرحباً بك في لينك",
  subtitleEn: "Find the best services near you",
  subtitleAr: "اعثري على أفضل الخدمات بالقرب منك",
  backgroundColor: "#f8e1e7",
  textColor: "#1a1a1a",
  linkUrl: "",
  updatedAt: new Date(),
};

export const getBannerSettings = async (): Promise<BannerSettings> => {
  try {
    const bannerRef = doc(db, COLLECTIONS.SETTINGS, "banner");
    const bannerSnap = await getDoc(bannerRef);

    if (!bannerSnap.exists()) {
      return DEFAULT_BANNER;
    }

    const data = bannerSnap.data();
    return {
      isActive: data.isActive ?? false,
      titleEn: data.titleEn ?? DEFAULT_BANNER.titleEn,
      titleAr: data.titleAr ?? DEFAULT_BANNER.titleAr,
      subtitleEn: data.subtitleEn ?? DEFAULT_BANNER.subtitleEn,
      subtitleAr: data.subtitleAr ?? DEFAULT_BANNER.subtitleAr,
      backgroundColor: data.backgroundColor ?? DEFAULT_BANNER.backgroundColor,
      textColor: data.textColor ?? DEFAULT_BANNER.textColor,
      linkUrl: data.linkUrl ?? "",
      updatedAt: timestampToDate(data.updatedAt),
    };
  } catch (error) {
    console.warn("Error fetching banner settings:", error);
    return DEFAULT_BANNER;
  }
};

export const updateBannerSettings = async (
  settings: Partial<BannerSettings>,
): Promise<void> => {
  const bannerRef = doc(db, COLLECTIONS.SETTINGS, "banner");
  await setDoc(
    bannerRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};
