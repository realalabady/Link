import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Globe,
  Bell,
  KeyRound,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import { useProviderBookings } from "@/hooks/queries/useBookings";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  useProviderProfile,
  useUpdateProviderProfile,
} from "@/hooks/queries/useProviders";

// Mock data for wallet - would come from Firestore
const mockWallet = {
  balance: 1250.0,
  pendingBalance: 350.0,
  currency: "SAR",
};

const mockTransactions = [
  {
    id: "1",
    type: "credit",
    amount: 150,
    description: "Booking #1234 completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: "completed",
  },
  {
    id: "2",
    type: "credit",
    amount: 200,
    description: "Booking #1233 completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: "completed",
  },
  {
    id: "3",
    type: "debit",
    amount: 500,
    description: "Payout to bank account",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: "completed",
  },
];

const SAUDI_REGIONS = [
  {
    value: "Riyadh",
    label: { en: "Riyadh", ar: "الرياض" },
    cities: [
      {
        value: "Riyadh",
        label: { en: "Riyadh", ar: "الرياض" },
        districts: [
          { value: "Al Olaya", label: { en: "Al Olaya", ar: "العليا" } },
          { value: "Al Malqa", label: { en: "Al Malqa", ar: "الملقا" } },
          { value: "Al Nakheel", label: { en: "Al Nakheel", ar: "النخيل" } },
        ],
      },
      {
        value: "Al Kharj",
        label: { en: "Al Kharj", ar: "الخرج" },
        districts: [
          { value: "Al Yarmouk", label: { en: "Al Yarmouk", ar: "اليرموك" } },
          { value: "Al Andalus", label: { en: "Al Andalus", ar: "الأندلس" } },
        ],
      },
    ],
  },
  {
    value: "Makkah",
    label: { en: "Makkah", ar: "مكة المكرمة" },
    cities: [
      {
        value: "Jeddah",
        label: { en: "Jeddah", ar: "جدة" },
        districts: [
          { value: "Al Hamra", label: { en: "Al Hamra", ar: "الحمراء" } },
          { value: "Al Rawdah", label: { en: "Al Rawdah", ar: "الروضة" } },
        ],
      },
      {
        value: "Makkah",
        label: { en: "Makkah", ar: "مكة" },
        districts: [
          { value: "Ajyad", label: { en: "Ajyad", ar: "أجياد" } },
          {
            value: "Al Aziziyah",
            label: { en: "Al Aziziyah", ar: "العزيزية" },
          },
        ],
      },
      {
        value: "Taif",
        label: { en: "Taif", ar: "الطائف" },
        districts: [
          { value: "Shubra", label: { en: "Shubra", ar: "الشفا" } },
          { value: "Al Hawiyah", label: { en: "Al Hawiyah", ar: "الحوية" } },
        ],
      },
    ],
  },
  {
    value: "Madinah",
    label: { en: "Madinah", ar: "المدينة المنورة" },
    cities: [
      {
        value: "Madinah",
        label: { en: "Madinah", ar: "المدينة" },
        districts: [
          { value: "Quba", label: { en: "Quba", ar: "قباء" } },
          { value: "Al Aqiq", label: { en: "Al Aqiq", ar: "العقيق" } },
        ],
      },
      {
        value: "Yanbu",
        label: { en: "Yanbu", ar: "ينبع" },
        districts: [
          { value: "Al Murjan", label: { en: "Al Murjan", ar: "المرجان" } },
          { value: "Al Balad", label: { en: "Al Balad", ar: "البلد" } },
        ],
      },
    ],
  },
  {
    value: "Eastern Province",
    label: { en: "Eastern Province", ar: "المنطقة الشرقية" },
    cities: [
      {
        value: "Dammam",
        label: { en: "Dammam", ar: "الدمام" },
        districts: [
          {
            value: "Al Faisaliyah",
            label: { en: "Al Faisaliyah", ar: "الفيصلية" },
          },
          { value: "Al Shati", label: { en: "Al Shati", ar: "الشاطئ" } },
        ],
      },
      {
        value: "Khobar",
        label: { en: "Khobar", ar: "الخبر" },
        districts: [
          { value: "Al Ulaya", label: { en: "Al Ulaya", ar: "العليا" } },
          { value: "Al Rakah", label: { en: "Al Rakah", ar: "الراكة" } },
        ],
      },
      {
        value: "Dhahran",
        label: { en: "Dhahran", ar: "الظهران" },
        districts: [
          { value: "Al Dana", label: { en: "Al Dana", ar: "الدانة" } },
          { value: "KFUPM", label: { en: "KFUPM", ar: "جامعة الملك فهد" } },
        ],
      },
    ],
  },
  {
    value: "Qassim",
    label: { en: "Qassim", ar: "القصيم" },
    cities: [
      {
        value: "Buraydah",
        label: { en: "Buraydah", ar: "بريدة" },
        districts: [
          { value: "Al Rawdah", label: { en: "Al Rawdah", ar: "الروضة" } },
          { value: "Al Iskan", label: { en: "Al Iskan", ar: "الإسكان" } },
        ],
      },
      {
        value: "Unaizah",
        label: { en: "Unaizah", ar: "عنيزة" },
        districts: [
          {
            value: "Al Salhiyah",
            label: { en: "Al Salhiyah", ar: "الصالحية" },
          },
          {
            value: "Al Khalidiyah",
            label: { en: "Al Khalidiyah", ar: "الخالدية" },
          },
        ],
      },
    ],
  },
  {
    value: "Asir",
    label: { en: "Asir", ar: "عسير" },
    cities: [
      {
        value: "Abha",
        label: { en: "Abha", ar: "أبها" },
        districts: [
          { value: "Al Nasb", label: { en: "Al Nasb", ar: "النصب" } },
          {
            value: "Al Khaldiyah",
            label: { en: "Al Khaldiyah", ar: "الخالدية" },
          },
        ],
      },
      {
        value: "Khamis Mushait",
        label: { en: "Khamis Mushait", ar: "خميس مشيط" },
        districts: [
          { value: "Al Dabab", label: { en: "Al Dabab", ar: "الضباب" } },
          {
            value: "Al Thalatha",
            label: { en: "Al Thalatha", ar: "الثلاثاء" },
          },
        ],
      },
    ],
  },
  {
    value: "Tabuk",
    label: { en: "Tabuk", ar: "تبوك" },
    cities: [
      {
        value: "Tabuk",
        label: { en: "Tabuk", ar: "تبوك" },
        districts: [
          { value: "Al Wurud", label: { en: "Al Wurud", ar: "الورود" } },
          {
            value: "Al Sulaymaniyah",
            label: { en: "Al Sulaymaniyah", ar: "السليمانية" },
          },
        ],
      },
      {
        value: "Duba",
        label: { en: "Duba", ar: "ضباء" },
        districts: [
          { value: "Al Shati", label: { en: "Al Shati", ar: "الشاطئ" } },
        ],
      },
    ],
  },
  {
    value: "Hail",
    label: { en: "Hail", ar: "حائل" },
    cities: [
      {
        value: "Hail",
        label: { en: "Hail", ar: "حائل" },
        districts: [
          { value: "Al Nafl", label: { en: "Al Nafl", ar: "النفل" } },
          { value: "Al Mahattah", label: { en: "Al Mahattah", ar: "المحطة" } },
        ],
      },
      {
        value: "Baqaa",
        label: { en: "Baqaa", ar: "بقعاء" },
        districts: [
          { value: "Al Batin", label: { en: "Al Batin", ar: "الباطن" } },
        ],
      },
    ],
  },
  {
    value: "Northern Borders",
    label: { en: "Northern Borders", ar: "الحدود الشمالية" },
    cities: [
      {
        value: "Arar",
        label: { en: "Arar", ar: "عرعر" },
        districts: [
          { value: "Al Matar", label: { en: "Al Matar", ar: "المطار" } },
          { value: "Al Rabi", label: { en: "Al Rabi", ar: "الربيع" } },
        ],
      },
    ],
  },
  {
    value: "Jazan",
    label: { en: "Jazan", ar: "جازان" },
    cities: [
      {
        value: "Jazan",
        label: { en: "Jazan", ar: "جازان" },
        districts: [
          { value: "Al Rawdah", label: { en: "Al Rawdah", ar: "الروضة" } },
          { value: "Al Safa", label: { en: "Al Safa", ar: "الصفا" } },
        ],
      },
      {
        value: "Sabya",
        label: { en: "Sabya", ar: "صبيا" },
        districts: [
          { value: "Al Safa", label: { en: "Al Safa", ar: "الصفا" } },
        ],
      },
    ],
  },
  {
    value: "Najran",
    label: { en: "Najran", ar: "نجران" },
    cities: [
      {
        value: "Najran",
        label: { en: "Najran", ar: "نجران" },
        districts: [
          {
            value: "Al Khalidiyah",
            label: { en: "Al Khalidiyah", ar: "الخالدية" },
          },
          {
            value: "Al Faysaliyah",
            label: { en: "Al Faysaliyah", ar: "الفيصلية" },
          },
        ],
      },
      {
        value: "Sharurah",
        label: { en: "Sharurah", ar: "شرورة" },
        districts: [
          { value: "Al Mahd", label: { en: "Al Mahd", ar: "المهد" } },
        ],
      },
    ],
  },
  {
    value: "Al Bahah",
    label: { en: "Al Bahah", ar: "الباحة" },
    cities: [
      {
        value: "Al Bahah",
        label: { en: "Al Bahah", ar: "الباحة" },
        districts: [
          { value: "Al Zaher", label: { en: "Al Zaher", ar: "الزاهر" } },
          { value: "Al Atawlah", label: { en: "Al Atawlah", ar: "الأطاولة" } },
        ],
      },
    ],
  },
  {
    value: "Al Jawf",
    label: { en: "Al Jawf", ar: "الجوف" },
    cities: [
      {
        value: "Sakaka",
        label: { en: "Sakaka", ar: "سكاكا" },
        districts: [
          {
            value: "Al Suwaiflah",
            label: { en: "Al Suwaiflah", ar: "السويفلة" },
          },
          { value: "Al Badiah", label: { en: "Al Badiah", ar: "البادية" } },
        ],
      },
      {
        value: "Dumat Al Jandal",
        label: { en: "Dumat Al Jandal", ar: "دومة الجندل" },
        districts: [
          { value: "Al Qasr", label: { en: "Al Qasr", ar: "القصر" } },
        ],
      },
    ],
  },
];

const ProviderProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isArabic = i18n.language === "ar";

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: providerProfile } = useProviderProfile(user?.uid || "");
  const { data: providerBookings = [] } = useProviderBookings(user?.uid || "");
  const completedBookingsCount = providerBookings.filter(
    (b) => b.status === "COMPLETED",
  ).length;
  const [verificationStatus, setVerificationStatus] = useState<
    "NONE" | "PENDING" | "APPROVED"
  >("NONE");
  // Check if already requested (mock: in real app, fetch from verifications collection)
  useEffect(() => {
    // TODO: Replace with Firestore check for real status
    setVerificationStatus(providerProfile?.isVerified ? "APPROVED" : "NONE");
  }, [providerProfile]);

  const handleRequestVerification = async () => {
    setIsLoading(true);
    try {
      await addDoc(collection(db, "verifications"), {
        providerId: user?.uid,
        status: "PENDING",
        requestedAt: serverTimestamp(),
      });
      setVerificationStatus("PENDING");
    } finally {
      setIsLoading(false);
    }
  };
  const updateProviderProfileMutation = useUpdateProviderProfile();

  const [formValues, setFormValues] = useState({
    displayName: providerProfile?.displayName || user?.name || "",
    email: user?.email || "",
    phone: providerProfile?.phone || "",
    region: providerProfile?.region || "",
    city: providerProfile?.city || "",
    district: providerProfile?.area || "",
    bio: providerProfile?.bio || "",
    latitude: providerProfile?.latitude,
    longitude: providerProfile?.longitude,
    bankAccountHolder: providerProfile?.bankAccountHolder || "",
    bankName: providerProfile?.bankName || "",
    bankAccountNumber: providerProfile?.bankAccountNumber || "",
    bankIBAN: providerProfile?.bankIBAN || "",
  });

  useEffect(() => {
    const inferredRegion =
      providerProfile?.region ||
      (providerProfile?.city
        ? SAUDI_REGIONS.find((region) =>
            region.cities.some((city) => city.value === providerProfile.city),
          )?.value || ""
        : "");

    setFormValues({
      displayName: providerProfile?.displayName || user?.name || "",
      email: user?.email || "",
      phone: providerProfile?.phone || "",
      region: inferredRegion,
      city: providerProfile?.city || "",
      district: providerProfile?.area || "",
      bio: providerProfile?.bio || "",
      latitude: providerProfile?.latitude,
      longitude: providerProfile?.longitude,
      bankAccountHolder: providerProfile?.bankAccountHolder || "",
      bankName: providerProfile?.bankName || "",
      bankAccountNumber: providerProfile?.bankAccountNumber || "",
      bankIBAN: providerProfile?.bankIBAN || "",
    });
  }, [providerProfile, user]);

  const completionPercent = useMemo(() => {
    const fields = [
      formValues.displayName,
      formValues.email,
      formValues.phone,
      formValues.region,
      formValues.city,
      formValues.district,
      formValues.bio,
    ];
    const filled = fields.filter((value) => value?.toString().trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [formValues]);

  const selectedRegion = useMemo(
    () => SAUDI_REGIONS.find((region) => region.value === formValues.region),
    [formValues.region],
  );

  const cityOptions = selectedRegion?.cities || [];

  const selectedCity = useMemo(
    () => cityOptions.find((city) => city.value === formValues.city),
    [cityOptions, formValues.city],
  );

  const districtOptions = selectedCity?.districts || [];

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${mockWallet.currency}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 24) {
      return date.toLocaleTimeString(isArabic ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffHours < 48) {
      return t("chat.yesterday");
    } else {
      return date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getLabel = (item: { label: { en: string; ar: string } }) =>
    isArabic ? item.label.ar : item.label.en;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0 || amount > mockWallet.balance) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setPayoutDialogOpen(false);
    setPayoutAmount("");
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleCancelEdit = () => {
    setFormValues({
      displayName: providerProfile?.displayName || user?.name || "",
      email: user?.email || "",
      phone: providerProfile?.phone || "",
      region: providerProfile?.region || "",
      city: providerProfile?.city || "",
      district: providerProfile?.area || "",
      bio: providerProfile?.bio || "",
      latitude: providerProfile?.latitude,
      longitude: providerProfile?.longitude,
    });
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    await Promise.all([
      updateProviderProfileMutation.mutateAsync({
        uid: user.uid,
        updates: {
          displayName: formValues.displayName,
          phone: formValues.phone,
          region: formValues.region,
          city: formValues.city,
          area: formValues.district,
          bio: formValues.bio,
          latitude: formValues.latitude,
          longitude: formValues.longitude,
          bankAccountHolder: formValues.bankAccountHolder,
          bankName: formValues.bankName,
          bankAccountNumber: formValues.bankAccountNumber,
          bankIBAN: formValues.bankIBAN,
        },
      }),
      updateUserProfile(user.uid, {
        name: formValues.displayName,
      }),
    ]);
    await refreshUser();
    setIsEditing(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormValues((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      },
      () => {
        // Ignore location errors
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 600000 },
    );
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container py-4">
          <h1 className="text-xl font-semibold text-foreground">
            {t("nav.profile")}
          </h1>
        </div>
      </header>

      <main className="container py-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Profile Completion */}
          <motion.div variants={fadeInUp} className="mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">
                    {t("profile.completion")}
                  </p>
                  <span className="text-sm font-semibold text-primary">
                    {completionPercent}%
                  </span>
                </div>
                <Progress value={completionPercent} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("profile.completePercent", { percent: completionPercent })}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Card */}
          <motion.div variants={fadeInUp} className="mb-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {t("profile.personalInfo")}
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditToggle}
                    >
                      {t("profile.editProfile")}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={updateProviderProfileMutation.isPending}
                      >
                        {updateProviderProfileMutation.isPending
                          ? t("common.loading")
                          : t("profile.save")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground">
                      {formValues.displayName || t("profile.guest")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("common.provider")}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="profile-name">
                      {t("profile.fullName")}
                    </Label>
                    <Input
                      id="profile-name"
                      value={formValues.displayName}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-email">{t("profile.email")}</Label>
                    <Input
                      id="profile-email"
                      value={formValues.email}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-phone">{t("profile.phone")}</Label>
                    <Input
                      id="profile-phone"
                      value={formValues.phone}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder={t("profile.addPhone")}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-region">
                      {t("profile.region")}
                    </Label>
                    <Select
                      value={formValues.region}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({
                          ...prev,
                          region: value,
                          city: "",
                          district: "",
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="profile-region" className="mt-1">
                        <SelectValue
                          placeholder={t("profile.regionPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {SAUDI_REGIONS.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {getLabel(region)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profile-city">{t("profile.city")}</Label>
                    <Select
                      value={formValues.city}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({
                          ...prev,
                          city: value,
                          district: "",
                        }))
                      }
                      disabled={!isEditing || !formValues.region}
                    >
                      <SelectTrigger id="profile-city" className="mt-1">
                        <SelectValue
                          placeholder={t("profile.cityPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {cityOptions.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {getLabel(city)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profile-district">
                      {t("profile.district")}
                    </Label>
                    <Select
                      value={formValues.district}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({
                          ...prev,
                          district: value,
                        }))
                      }
                      disabled={!isEditing || !formValues.city}
                    >
                      <SelectTrigger id="profile-district" className="mt-1">
                        <SelectValue
                          placeholder={t("profile.districtPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {districtOptions.map((district) => (
                          <SelectItem
                            key={district.value}
                            value={district.value}
                          >
                            {getLabel(district)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="profile-bio">{t("profile.bio")}</Label>
                  <Textarea
                    id="profile-bio"
                    value={formValues.bio}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    placeholder={t("profile.bioPlaceholder")}
                    disabled={!isEditing}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    disabled={!isEditing}
                  >
                    {t("profile.useCurrentLocation")}
                  </Button>
                  {formValues.latitude && formValues.longitude && (
                    <span className="text-xs text-muted-foreground">
                      {t("profile.locationSaved")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bank Account Section */}
          <motion.div variants={fadeInUp} className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {t("profile.bankAccount")}
            </h2>
            <Card>
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="bank-holder">
                      {t("profile.accountHolder")}
                    </Label>
                    <Input
                      id="bank-holder"
                      value={formValues.bankAccountHolder}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          bankAccountHolder: e.target.value,
                        }))
                      }
                      placeholder={t("profile.accountHolderPlaceholder")}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank-name">{t("profile.bankName")}</Label>
                    <Input
                      id="bank-name"
                      value={formValues.bankName}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          bankName: e.target.value,
                        }))
                      }
                      placeholder={t("profile.bankNamePlaceholder")}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account-number">
                      {t("profile.accountNumber")}
                    </Label>
                    <Input
                      id="account-number"
                      value={formValues.bankAccountNumber}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          bankAccountNumber: e.target.value,
                        }))
                      }
                      placeholder={t("profile.accountNumberPlaceholder")}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="iban">{t("profile.iban")}</Label>
                    <Input
                      id="iban"
                      value={formValues.bankIBAN}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          bankIBAN: e.target.value,
                        }))
                      }
                      placeholder={t("profile.ibanPlaceholder")}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallet Section */}
          {/* Settings Section */}
          <motion.div variants={fadeInUp} className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {t("profile.accountSettings")}
            </h2>
            <Card>
              <CardContent className="p-0">
                {/* Language */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <span>{t("profile.language")}</span>
                  </div>
                  <LanguageSwitcher />
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-muted-foreground" />
                    <span>{t("profile.darkMode")}</span>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? "dark" : "light")
                    }
                  />
                </div>

                {/* Get Verified Button */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span>Get Verified</span>
                  </div>
                  {verificationStatus === "APPROVED" ? (
                    <Badge className="bg-green-500">Verified</Badge>
                  ) : verificationStatus === "PENDING" ? (
                    <Badge className="bg-yellow-500">Pending</Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={completedBookingsCount < 10 || isLoading}
                      onClick={handleRequestVerification}
                    >
                      {isLoading
                        ? "Requesting..."
                        : `Get Verified (${completedBookingsCount}/10)`}
                    </Button>
                  )}
                </div>

                {/* Reset Password */}
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-4 border-b text-left"
                  onClick={() => navigate("/auth/forgot-password")}
                >
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <span>{t("auth.resetPassword")}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                {/* Help */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span>{t("profile.helpCenter")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/help")}
                    className="text-muted-foreground"
                  >
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logout Button */}
          <motion.div variants={fadeInUp}>
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("common.logout")}
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* Logout Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.logoutTitle")}</DialogTitle>
            <DialogDescription>
              {t("profile.logoutDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              {t("common.logout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("wallet.requestPayout")}</DialogTitle>
            <DialogDescription>
              {t("wallet.payoutDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">{t("wallet.amount")}</Label>
              <Input
                id="amount"
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {t("wallet.available")}: {formatCurrency(mockWallet.balance)}
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">{t("wallet.payoutWarning")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayoutDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={
                isLoading ||
                !payoutAmount ||
                parseFloat(payoutAmount) <= 0 ||
                parseFloat(payoutAmount) > mockWallet.balance
              }
            >
              {isLoading ? t("common.loading") : t("wallet.requestPayout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProfilePage;
