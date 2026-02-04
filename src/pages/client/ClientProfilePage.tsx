import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Globe,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  KeyRound,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

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

const ClientProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, deleteAccount, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isArabic = i18n.language === "ar";

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    region: user?.region || "",
    city: user?.city || "",
    district: user?.district || "",
  });

  useEffect(() => {
    const inferredRegion =
      user?.region ||
      (user?.city
        ? SAUDI_REGIONS.find((region) =>
            region.cities.some((city) => city.value === user.city),
          )?.value || ""
        : "");

    setFormValues({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      region: inferredRegion,
      city: user?.city || "",
      district: user?.district || "",
    });
    setNotificationsEnabled(user?.notificationsEnabled ?? true);
  }, [user]);

  const completionPercent = useMemo(() => {
    const fields = [
      formValues.name,
      formValues.email,
      formValues.phone,
      formValues.region,
      formValues.city,
      formValues.district,
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

  const getLabel = (item: { label: { en: string; ar: string } }) =>
    isArabic ? item.label.ar : item.label.en;

  const handleLogout = async () => {
    await logout();
    setLogoutDialogOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error(t("profile.enterPassword"));
      return;
    }
    setIsDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      setDeleteAccountDialogOpen(false);
      setDeletePassword("");
      navigate("/");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      // Handle wrong password error
      const errorCode = error?.code || error?.message || "";
      if (errorCode.includes("wrong-password") || errorCode.includes("invalid-credential") || errorCode.includes("INVALID_LOGIN_CREDENTIALS")) {
        toast.error(t("profile.wrongPassword"));
      } else {
        toast.error(t("common.error"));
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelEdit = () => {
    setFormValues({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      region: user?.region || "",
      city: user?.city || "",
      district: user?.district || "",
    });
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        name: formValues.name,
        phone: formValues.phone,
        region: formValues.region,
        city: formValues.city,
        district: formValues.district,
      });
      await refreshUser();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
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
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
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
                      onClick={() => setIsEditing(true)}
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
                        disabled={isSaving}
                      >
                        {isSaving ? t("common.loading") : t("profile.save")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                    👩
                  </div>

                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground">
                      {formValues.name || t("profile.guest")}
                    </h2>
                    <p className="text-muted-foreground">{formValues.email}</p>
                    <p className="mt-1 text-sm text-primary">
                      {t("roles.client")}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="client-name">{t("profile.fullName")}</Label>
                    <Input
                      id="client-name"
                      value={formValues.name}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-email">{t("profile.email")}</Label>
                    <Input
                      id="client-email"
                      value={formValues.email}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-phone">{t("profile.phone")}</Label>
                    <Input
                      id="client-phone"
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
                    <Label htmlFor="client-region">{t("profile.region")}</Label>
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
                      <SelectTrigger id="client-region" className="mt-1">
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
                    <Label htmlFor="client-city">{t("profile.city")}</Label>
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
                      <SelectTrigger id="client-city" className="mt-1">
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
                    <Label htmlFor="client-district">
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
                      <SelectTrigger id="client-district" className="mt-1">
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferences */}
          <motion.section variants={fadeInUp} className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("profile.preferences")}
            </h3>
            <Card>
              <CardContent className="p-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-4 border-b text-start transition-colors hover:bg-accent"
                  onClick={() => navigate("/auth/forgot-password")}
                >
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                    <span>{t("auth.resetPassword")}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <div className="flex items-center gap-3 p-4 border-b transition-colors hover:bg-accent">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="truncate">
                      {t("profile.notifications")}
                    </span>
                  </div>
                  <Switch
                    className="shrink-0"
                    checked={notificationsEnabled}
                    onCheckedChange={async (checked) => {
                      setNotificationsEnabled(checked);
                      if (user) {
                        await updateUserProfile(user.uid, {
                          notificationsEnabled: checked,
                        });
                        await refreshUser();
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 border-b transition-colors hover:bg-accent">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span>{t("profile.language")}</span>
                  <div className="ms-auto">
                    <LanguageSwitcher />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 transition-colors hover:bg-accent">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Moon className="h-5 w-5 text-muted-foreground" />
                    <span className="truncate">{t("profile.darkMode")}</span>
                  </div>
                  <Switch
                    className="shrink-0"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? "dark" : "light")
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Support */}
          <motion.section variants={fadeInUp} className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("profile.support")}
            </h3>
            <Card>
              <CardContent className="p-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-4 text-start transition-colors hover:bg-accent"
                  onClick={() => navigate("/help")}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <span>{t("profile.helpCenter")}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </motion.section>

          {/* Logout */}
          <motion.div variants={fadeInUp}>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="h-5 w-5" />
              {t("auth.logout")}
            </Button>
          </motion.div>

          {/* Delete Account */}
          <motion.div variants={fadeInUp}>
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => setDeleteAccountDialogOpen(true)}
            >
              <Trash2 className="h-5 w-5" />
              {t("profile.deleteAccount")}
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.logoutTitle")}</DialogTitle>
            <DialogDescription>
              {t("profile.logoutDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              {t("auth.logout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteAccountDialogOpen} onOpenChange={(open) => {
        setDeleteAccountDialogOpen(open);
        if (!open) setDeletePassword("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("profile.deleteAccountTitle")}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>{t("profile.deleteAccountDescription")}</p>
                <p className="font-semibold text-destructive">{t("profile.deleteAccountWarning")}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-password">{t("profile.confirmPassword")}</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t("profile.enterPasswordToConfirm")}
              className="mt-2"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteAccountDialogOpen(false);
                setDeletePassword("");
              }}
              disabled={isDeletingAccount}
            >
              {t("common.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || !deletePassword.trim()}
            >
              {isDeletingAccount ? t("common.loading") : t("profile.deleteAccount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientProfilePage;
