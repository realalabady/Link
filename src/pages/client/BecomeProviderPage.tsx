import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  FileText,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

// Saudi Arabia regions and cities
const REGIONS = [
  { id: "riyadh", nameEn: "Riyadh", nameAr: "الرياض" },
  { id: "makkah", nameEn: "Makkah", nameAr: "مكة المكرمة" },
  { id: "madinah", nameEn: "Madinah", nameAr: "المدينة المنورة" },
  { id: "eastern", nameEn: "Eastern Province", nameAr: "المنطقة الشرقية" },
  { id: "asir", nameEn: "Asir", nameAr: "عسير" },
  { id: "tabuk", nameEn: "Tabuk", nameAr: "تبوك" },
  { id: "hail", nameEn: "Hail", nameAr: "حائل" },
  { id: "northern", nameEn: "Northern Borders", nameAr: "الحدود الشمالية" },
  { id: "jazan", nameEn: "Jazan", nameAr: "جازان" },
  { id: "najran", nameEn: "Najran", nameAr: "نجران" },
  { id: "bahah", nameEn: "Al Bahah", nameAr: "الباحة" },
  { id: "jawf", nameEn: "Al Jawf", nameAr: "الجوف" },
  { id: "qassim", nameEn: "Qassim", nameAr: "القصيم" },
];

const BecomeProviderPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, becomeProvider } = useAuth();
  const isArabic = i18n.language === "ar";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    region: "",
    city: "",
    area: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user is already a provider
  if (user?.roles?.includes("PROVIDER")) {
    navigate("/provider", { replace: true });
    return null;
  }

  const handleBack = () => {
    navigate(-1);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bio.trim() || formData.bio.length < 20) {
      newErrors.bio = t(
        "becomeProvider.bioError",
        "Bio must be at least 20 characters",
      );
    }
    if (!formData.region) {
      newErrors.region = t(
        "becomeProvider.regionError",
        "Please select a region",
      );
    }
    if (!formData.city.trim()) {
      newErrors.city = t("becomeProvider.cityError", "Please enter your city");
    }
    if (!formData.area.trim()) {
      newErrors.area = t(
        "becomeProvider.areaError",
        "Please enter your area/district",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await becomeProvider({
        bio: formData.bio,
        region: formData.region,
        city: formData.city,
        area: formData.area,
      });

      toast.success(
        t("becomeProvider.success", "Welcome! You are now a provider"),
      );
      navigate("/provider", { replace: true });
    } catch (error) {
      console.error("Failed to become provider:", error);
      toast.error(t("becomeProvider.error", "Failed to complete registration"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <h1 className="text-lg font-semibold">
            {t("becomeProvider.title", "Become a Provider")}
          </h1>
        </div>
      </header>

      <main className="container py-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mx-auto max-w-lg"
        >
          {/* Hero Section */}
          <motion.div variants={fadeInUp} className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Briefcase className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              {t("becomeProvider.headline", "Start Earning Today")}
            </h2>
            <p className="text-muted-foreground">
              {t(
                "becomeProvider.subheadline",
                "Join our community of service providers and grow your business",
              )}
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            variants={fadeInUp}
            className="mb-8 rounded-2xl bg-card p-4"
          >
            <h3 className="mb-3 font-semibold text-foreground">
              {t("becomeProvider.benefits", "Why become a provider?")}
            </h3>
            <ul className="space-y-2">
              {[
                t(
                  "becomeProvider.benefit1",
                  "Reach more customers in your area",
                ),
                t(
                  "becomeProvider.benefit2",
                  "Set your own schedule and prices",
                ),
                t(
                  "becomeProvider.benefit3",
                  "Get paid securely through the app",
                ),
                t(
                  "becomeProvider.benefit4",
                  "Build your reputation with reviews",
                ),
              ].map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Form */}
          <motion.form
            variants={fadeInUp}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("becomeProvider.bioLabel", "About You")}
              </Label>
              <Textarea
                id="bio"
                placeholder={t(
                  "becomeProvider.bioPlaceholder",
                  "Tell clients about yourself, your experience, and the services you offer...",
                )}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="min-h-[120px]"
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 {t("common.characters", "characters")}
              </p>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label htmlFor="region" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("becomeProvider.regionLabel", "Region")}
              </Label>
              <Select
                value={formData.region}
                onValueChange={(value) =>
                  setFormData({ ...formData, region: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "becomeProvider.selectRegion",
                      "Select your region",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {isArabic ? region.nameAr : region.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-destructive">{errors.region}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">
                {t("becomeProvider.cityLabel", "City")}
              </Label>
              <Input
                id="city"
                placeholder={t(
                  "becomeProvider.cityPlaceholder",
                  "Enter your city",
                )}
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            {/* Area/District */}
            <div className="space-y-2">
              <Label htmlFor="area">
                {t("becomeProvider.areaLabel", "Area / District")}
              </Label>
              <Input
                id="area"
                placeholder={t(
                  "becomeProvider.areaPlaceholder",
                  "Enter your area or district",
                )}
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
              />
              {errors.area && (
                <p className="text-sm text-destructive">{errors.area}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("common.loading", "Loading...")}
                </>
              ) : (
                <>
                  <Briefcase className="me-2 h-4 w-4" />
                  {t("becomeProvider.submit", "Complete Registration")}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t(
                "becomeProvider.terms",
                "By registering, you agree to our Terms of Service and Provider Guidelines",
              )}
            </p>
          </motion.form>
        </motion.div>
      </main>
    </div>
  );
};

export default BecomeProviderPage;
